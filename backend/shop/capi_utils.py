import hashlib
import json
import urllib.request
import threading
import logging
from django.utils import timezone
from .models import SiteSettings

logger = logging.getLogger(__name__)

def sha256_hash(value):
    """
    Cleans and hashes a string using SHA-256 according to Meta specifications.
    All values must be lowercase and stripped of leading/trailing whitespace.
    """
    if not value:
        return None
    cleaned = str(value).strip().lower()
    return hashlib.sha256(cleaned.encode('utf-8')).hexdigest()

def clean_phone_number(phone):
    """
    Cleans phone number: strips non-digits and ensures Bangladesh country code prefix (88).
    """
    if not phone:
        return None
    # Strip any non-digit character
    digits = ''.join(c for c in str(phone) if c.isdigit())
    # Standardize Bangladesh numbers
    if len(digits) == 11 and digits.startswith('01'):
        digits = '88' + digits
    return digits

def _async_send_capi_event(url, payload, headers):
    """
    Asynchronous executor running in a background thread to make the HTTP POST request.
    """
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers=headers,
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = response.read().decode('utf-8')
            logger.info(f"Meta CAPI conversion request successfully processed: {res_body}")
    except Exception as e:
        logger.error(f"Error executing Meta CAPI server call: {e}")

def send_fb_capi_purchase(order):
    """
    Prepares and dispatches a server-side Purchase event to Meta Conversion API (CAPI).
    Uses a background thread to keep checkout latency low.
    """
    try:
        settings = SiteSettings.objects.first()
        if not settings:
            logger.warning("Meta CAPI aborted: SiteSettings record is missing.")
            return

        pixel_id = settings.facebook_pixel_id
        capi_token = settings.facebook_capi_token
        api_version = settings.facebook_api_version or 'v19.0'
        test_code = settings.facebook_test_code

        if not pixel_id or not capi_token:
            logger.info("Meta CAPI skipped: Pixel ID or Conversion Access Token not configured.")
            return

        # Prepare User Data
        user_data = {}

        # 1. Clean & Hash Phone Number (Highly critical for high conversion match score!)
        raw_phone = order.phone_number
        cleaned_phone = clean_phone_number(raw_phone)
        hashed_phone = sha256_hash(cleaned_phone)
        if hashed_phone:
            user_data['ph'] = [hashed_phone]

        # 2. Clean & Hash Email
        raw_email = order.customer_email
        if raw_email:
            hashed_email = sha256_hash(raw_email)
            if hashed_email:
                user_data['em'] = [hashed_email]

        # 3. Clean & Hash First Name
        raw_name = order.customer_name
        if raw_name:
            # Pick first word as first name
            first_name = raw_name.split()[0] if raw_name.strip() else raw_name
            hashed_fn = sha256_hash(first_name)
            if hashed_fn:
                user_data['fn'] = [hashed_fn]

        # 4. Client Metadata
        if order.ip_address:
            user_data['client_ip_address'] = order.ip_address
        if order.user_agent:
            user_data['client_user_agent'] = order.user_agent

        # Prepare Event Data
        event_time = int(timezone.now().timestamp())
        event_id = f"order_{order.id}" # Matches client-side eventID perfectly for deduplication!

        site_title = settings.site_title if settings else "spaceghor"
        site_title_clean = ''.join(c for c in site_title if c.isalnum()) or "spaceghor"

        event_data = {
            'event_name': 'Purchase',
            'event_time': event_time,
            'event_id': event_id,
            'event_source_url': f"https://{site_title_clean.lower()}.com/checkout", # standard fallback url
            'action_source': 'website',
            'user_data': user_data,
            'custom_data': {
                'currency': 'BDT',
                'value': float(order.total_amount)
            }
        }

        # Build payload
        payload = {
            'data': [event_data]
        }

        # Include test event code if sandbox logging is active
        if test_code and test_code.strip():
            payload['test_event_code'] = test_code.strip()

        # Build Graph URL
        url = f"https://graph.facebook.com/{api_version}/{pixel_id}/events?access_token={capi_token}"

        headers = {
            'Content-Type': 'application/json',
            'User-Agent': f'{site_title_clean}/1.0 ServerSide CAPI Trigger'
        }

        # Spin off background execution thread so customer is never kept waiting
        thread = threading.Thread(target=_async_send_capi_event, args=(url, payload, headers))
        thread.daemon = True
        thread.start()

    except Exception as e:
        logger.error(f"Failed to prepare Meta CAPI Purchase event: {e}")
