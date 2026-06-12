import requests
import logging
from .models import SiteSettings

logger = logging.getLogger(__name__)

def get_sms_settings():
    settings = SiteSettings.objects.first()
    if not settings:
        return None, None, None
    return settings.sms_api_key, settings.sms_sender_id, settings.otp_format

def send_sms(number, message):
    api_key, sender_id, _ = get_sms_settings()
    
    if not api_key or not sender_id:
        logger.error("SMS API Key or Sender ID not configured in SiteSettings.")
        return False, "SMS Configuration missing"

    url = "http://bulksmsbd.net/api/smsapi"
    params = {
        "api_key": api_key,
        "type": "text",
        "number": number,
        "senderid": sender_id,
        "message": message
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get('response_code') == 202:
            return True, "SMS Sent Successfully"
        else:
            error_message = data.get('success_message', 'Unknown Error')
            logger.error(f"SMS API Error: {error_message} (Code: {data.get('response_code')})")
            return False, error_message
    except Exception as e:
        logger.error(f"SMS Send Exception: {str(e)}")
        return False, str(e)

def get_balance():
    api_key, _, _ = get_sms_settings()
    if not api_key:
        return None

    url = "http://bulksmsbd.net/api/getBalanceApi"
    params = {"api_key": api_key}

    try:
        response = requests.get(url, params=params)
        data = response.json()
        return data.get('balance')
    except Exception as e:
        logger.error(f"SMS Balance Exception: {str(e)}")
        return None

def send_otp_sms(number, otp_code):
    api_key, sender_id, otp_template = get_sms_settings()
    settings = SiteSettings.objects.first()
    site_title = settings.site_title if settings else "Spaceghor"
    
    message = otp_template.format(site_title=site_title, otp=otp_code)
    return send_sms(number, message)
