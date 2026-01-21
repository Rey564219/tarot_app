import json
from datetime import datetime, timezone
from typing import Any

import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build

from ..config import (
    APPLE_SHARED_SECRET,
    APPLE_VERIFY_SANDBOX_URL,
    APPLE_VERIFY_URL,
    GOOGLE_PACKAGE_NAME,
    GOOGLE_SERVICE_ACCOUNT_JSON,
)


def verify_apple_receipt(receipt: str) -> dict[str, Any]:
    if not APPLE_SHARED_SECRET:
        raise RuntimeError('APPLE_SHARED_SECRET is not set')

    payload = {
        'receipt-data': receipt,
        'password': APPLE_SHARED_SECRET,
        'exclude-old-transactions': True,
    }

    response = requests.post(APPLE_VERIFY_URL, json=payload, timeout=10)
    data = response.json()

    # 21007 indicates sandbox receipt sent to production.
    if data.get('status') == 21007:
        response = requests.post(APPLE_VERIFY_SANDBOX_URL, json=payload, timeout=10)
        data = response.json()

    return data


def extract_apple_purchase(data: dict[str, Any]) -> dict[str, Any]:
    in_app = data.get('receipt', {}).get('in_app', [])
    if not in_app:
        raise ValueError('No in_app purchase found')

    latest = sorted(in_app, key=lambda x: x.get('purchase_date_ms', '0'))[-1]
    return {
        'transaction_id': latest.get('transaction_id'),
        'product_id': latest.get('product_id'),
        'status': 'verified',
    }


def extract_apple_subscription(data: dict[str, Any]) -> dict[str, Any]:
    latest_info = data.get('latest_receipt_info', [])
    if not latest_info:
        raise ValueError('No subscription info found')

    latest = sorted(latest_info, key=lambda x: x.get('expires_date_ms', '0'))[-1]
    expires_ms = int(latest.get('expires_date_ms', '0'))
    expires_at = datetime.fromtimestamp(expires_ms / 1000, tz=timezone.utc)
    return {
        'transaction_id': latest.get('transaction_id'),
        'product_id': latest.get('product_id'),
        'status': 'active' if expires_at > datetime.now(timezone.utc) else 'expired',
        'period_start': datetime.fromtimestamp(int(latest.get('purchase_date_ms', '0')) / 1000, tz=timezone.utc),
        'period_end': expires_at,
    }


def _build_google_client():
    if not GOOGLE_SERVICE_ACCOUNT_JSON:
        raise RuntimeError('GOOGLE_SERVICE_ACCOUNT_JSON is not set')

    info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(
        info,
        scopes=['https://www.googleapis.com/auth/androidpublisher'],
    )
    return build('androidpublisher', 'v3', credentials=creds, cache_discovery=False)


def verify_google_product(package_name: str, product_id: str, purchase_token: str) -> dict[str, Any]:
    client = _build_google_client()
    response = (
        client.purchases()
        .products()
        .get(packageName=package_name, productId=product_id, token=purchase_token)
        .execute()
    )
    purchase_state = response.get('purchaseState')
    return {
        'transaction_id': response.get('orderId'),
        'product_id': product_id,
        'status': 'verified' if purchase_state == 0 else 'canceled',
    }


def verify_google_subscription(package_name: str, subscription_id: str, purchase_token: str) -> dict[str, Any]:
    client = _build_google_client()
    response = (
        client.purchases()
        .subscriptions()
        .get(packageName=package_name, subscriptionId=subscription_id, token=purchase_token)
        .execute()
    )
    expiry_ms = int(response.get('expiryTimeMillis', '0'))
    expiry = datetime.fromtimestamp(expiry_ms / 1000, tz=timezone.utc)
    return {
        'transaction_id': response.get('orderId'),
        'product_id': subscription_id,
        'status': 'active' if expiry > datetime.now(timezone.utc) else 'expired',
        'period_start': datetime.fromtimestamp(int(response.get('startTimeMillis', '0')) / 1000, tz=timezone.utc),
        'period_end': expiry,
        'auto_renewing': response.get('autoRenewing', False),
    }


def resolve_google_package() -> str:
    if not GOOGLE_PACKAGE_NAME:
        raise RuntimeError('GOOGLE_PACKAGE_NAME is not set')
    return GOOGLE_PACKAGE_NAME
