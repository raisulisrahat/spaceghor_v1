import logging
import requests
from .models import SiteSettings

logger = logging.getLogger(__name__)

def get_bkash_headers(settings):
    """
    Get token and return authorization headers for bKash
    """
    if not settings.bkash_username or not settings.bkash_password or not settings.bkash_app_key or not settings.bkash_app_secret:
        logger.error("bKash credentials not configured.")
        return None

    base_url = settings.bkash_base_url.rstrip('/')
    if not base_url.endswith('/tokenized'):
        url = f"{base_url}/tokenized/checkout/token/grant"
    else:
        url = f"{base_url}/checkout/token/grant"
    
    headers = {
        "Content-Type": "application/json",
        "username": settings.bkash_username,
        "password": settings.bkash_password
    }
    
    payload = {
        "app_key": settings.bkash_app_key,
        "app_secret": settings.bkash_app_secret
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        if response.status_code == 200 and 'id_token' in response_data:
            return {
                "Content-Type": "application/json",
                "Authorization": response_data['id_token'],
                "X-APP-Key": settings.bkash_app_key
            }
        else:
            logger.error(f"bKash token grant failed: {response_data}")
            return None
    except Exception as e:
        logger.error(f"Error getting bKash token: {str(e)}")
        return None

def create_bkash_payment(order, callback_url):
    """
    Initiate bKash checkout payment
    """
    settings = SiteSettings.objects.first()
    if not settings:
        return None
        
    headers = get_bkash_headers(settings)
    if not headers:
        return None
        
    base_url = settings.bkash_base_url.rstrip('/')
    if not base_url.endswith('/tokenized'):
        url = f"{base_url}/tokenized/checkout/payment/create"
    else:
        url = f"{base_url}/checkout/payment/create"
    
    payload = {
        "mode": "0011",
        "payerReference": order.phone_number,
        "callbackURL": callback_url,
        "amount": f"{float(order.total_amount):.2f}",
        "currency": "BDT",
        "intent": "sale",
        "merchantInvoiceNumber": str(order.id)
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        if response.status_code == 200 and 'paymentID' in response_data:
            return response_data
        else:
            logger.error(f"bKash create payment failed: {response_data}")
            return None
    except Exception as e:
        logger.error(f"Error creating bKash payment: {str(e)}")
        return None

def execute_bkash_payment(payment_id):
    """
    Confirm/Execute bKash payment
    """
    settings = SiteSettings.objects.first()
    if not settings:
        return None
        
    headers = get_bkash_headers(settings)
    if not headers:
        return None
        
    base_url = settings.bkash_base_url.rstrip('/')
    if not base_url.endswith('/tokenized'):
        url = f"{base_url}/tokenized/checkout/payment/execute"
    else:
        url = f"{base_url}/checkout/payment/execute"
    
    payload = {
        "paymentID": payment_id
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        return response_data
    except Exception as e:
        logger.error(f"Error executing bKash payment: {str(e)}")
        return None
