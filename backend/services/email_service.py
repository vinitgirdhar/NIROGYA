# backend/services/email_service.py
"""
Email service using Resend for OTP authentication and alert notifications.
"""
import os
import random
import string
from dotenv import load_dotenv

load_dotenv()

import resend

# Initialize Resend with API key
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
resend.api_key = RESEND_API_KEY

# For development without API key, we'll log emails
DEV_MODE = not RESEND_API_KEY


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send OTP to user's email.
    Returns True if sent successfully, False otherwise.
    """
    subject = "Your Nirogya Login OTP"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">💧 Nirogya</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Smart Health Surveillance System</p>
        </div>
        <div style="padding: 40px 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Your Login OTP</h2>
            <p style="color: #666; font-size: 16px;">Use the following OTP to complete your login:</p>
            <div style="background: white; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">{otp}</span>
            </div>
            <p style="color: #999; font-size: 14px;">⏱️ This OTP expires in <strong>5 minutes</strong>.</p>
            <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">© 2024 Nirogya. Protecting communities through technology.</p>
        </div>
    </div>
    """
    
    if DEV_MODE:
        print(f"[DEV EMAIL - OTP] To: {to_email}")
        print(f"[DEV EMAIL - OTP] OTP Code: {otp}")
        print("[DEV EMAIL - OTP] Email would be sent in production mode")
        return True
    
    try:
        params: resend.Emails.SendParams = {
            "from": "Nirogya <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        response = resend.Emails.send(params)
        print(f"[EMAIL] OTP sent to {to_email}, response: {response}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP: {e}")
        return False


def send_water_alert_email(to_email: str, alert_data: dict) -> bool:
    """
    Send water contamination alert to users in affected region.
    Returns True if sent successfully, False otherwise.
    """
    region = alert_data.get('region', 'Your Area')
    title = alert_data.get('title', 'Water Contamination Detected')
    description = alert_data.get('description', 'Water contamination has been detected in your area.')
    severity = alert_data.get('severity', 'high')
    issued_by = alert_data.get('issued_by', 'Health Department')
    
    # Color based on severity
    severity_colors = {
        'low': '#52c41a',
        'medium': '#faad14',
        'high': '#ff4d4f',
        'critical': '#cf1322'
    }
    severity_color = severity_colors.get(severity, '#ff4d4f')
    
    subject = f"⚠️ WATER ALERT: {region}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, {severity_color} 0%, #ff7875 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ WATER ALERT</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Important Health Advisory</p>
        </div>
        <div style="padding: 40px 30px; background: #fff5f5;">
            <div style="background: white; border-left: 4px solid {severity_color}; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: {severity_color}; margin: 0 0 10px 0;">🚨 {title}</h2>
                <p style="color: #666; margin: 0;"><strong>Region:</strong> {region}</p>
                <p style="color: #666; margin: 5px 0 0 0;"><strong>Severity:</strong> {severity.upper()}</p>
            </div>
            
            <div style="background: white; border-radius: 10px; padding: 25px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">📋 Alert Details</h3>
                <p style="color: #666; line-height: 1.8;">{description}</p>
            </div>
            
            <div style="background: #fff7e6; border: 1px solid #ffc53d; border-radius: 10px; padding: 25px; margin: 20px 0;">
                <h3 style="color: #d48806; margin-top: 0;">✅ Recommended Actions</h3>
                <ul style="color: #666; line-height: 2;">
                    <li><strong>Boil water</strong> for at least 1 minute before drinking</li>
                    <li>Avoid using tap water for cooking without boiling</li>
                    <li>Use bottled water if available</li>
                    <li>Report any symptoms to your nearest health center</li>
                    <li>Contact local ASHA worker for assistance</li>
                </ul>
            </div>
            
            <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 10px; padding: 20px; margin-top: 20px;">
                <p style="color: #52c41a; margin: 0; font-weight: bold;">📞 Emergency Helpline: 108</p>
            </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">This alert was sent by Nirogya Health Surveillance System</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Issued by: {issued_by}</p>
        </div>
    </div>
    """
    
    if DEV_MODE:
        print(f"[DEV EMAIL - ALERT] To: {to_email}")
        print(f"[DEV EMAIL - ALERT] Region: {region}, Title: {title}")
        print("[DEV EMAIL - ALERT] Email would be sent in production mode")
        return True
    
    try:
        params: resend.Emails.SendParams = {
            "from": "Nirogya Alerts <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        response = resend.Emails.send(params)
        print(f"[EMAIL] Alert sent to {to_email}, response: {response}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send alert: {e}")
        return False


def send_test_email(to_email: str) -> bool:
    """
    Send a test email to verify the email service is working.
    """
    subject = "Test Email from Nirogya"
    html_content = """
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>🎉 Email Service Working!</h1>
        <p>Congrats! Your Nirogya email service is configured correctly.</p>
        <p>This is a test email sent via Resend.</p>
    </div>
    """
    
    if DEV_MODE:
        print(f"[DEV EMAIL - TEST] To: {to_email}")
        print("[DEV EMAIL - TEST] Test email would be sent in production mode")
        return True
    
    try:
        params: resend.Emails.SendParams = {
            "from": "Nirogya <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        response = resend.Emails.send(params)
        print(f"[EMAIL] Test email sent to {to_email}, response: {response}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send test email: {e}")
        return False
