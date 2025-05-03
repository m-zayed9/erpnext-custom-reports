import frappe
import random

@frappe.whitelist()
def send_verification_code(**kwargs):
    customer = kwargs.get("customer")
    invoice_name = kwargs.get("invoice_name")

    if not customer:
        raise 

    verification_code = create_or_update_otp_code(customer ,invoice_name)

    customer_doc = frappe.get_doc("Customer", customer)
    contact_email = customer_doc.email_id if customer_doc.email_id else None
    if contact_email:
        frappe.sendmail(
            recipients=[contact_email],
            subject="Your Sales Invoice Verification Code",
            message=f"Your verification code for Sales Invoice is: {verification_code}"
        )
    return {
        'success':True
    }

def create_or_update_otp_code(customer, invoice_number):
    verification_code = str(random.randint(100000, 999999))

    existing_otp = frappe.db.exists("OTP Code", {"invoice": invoice_number})

    existing_otp_record_name = frappe.db.get_value(
        "OTP Code", 
        {"invoice": invoice_number}, 
        "name"
    )

    if existing_otp_record_name:
        otp_doc = frappe.get_doc("OTP Code", existing_otp_record_name)
        otp_doc.customer = customer
        otp_doc.code = verification_code
        otp_doc.save()
    else:
        new_otp_doc = frappe.new_doc("OTP Code")
        new_otp_doc.customer = customer
        new_otp_doc.invoice = invoice_number
        new_otp_doc.code = verification_code
        new_otp_doc.insert()
        
    return verification_code


@frappe.whitelist()
def validate_verification_code(invoice_name, entered_code):

    otp_doc = frappe.db.get(
        "OTP Code", 
        {"invoice": invoice_name}
    )    

    if otp_doc.code == entered_code:
        return True
    return False