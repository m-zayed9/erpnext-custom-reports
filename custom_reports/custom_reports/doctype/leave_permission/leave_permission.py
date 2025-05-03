import frappe
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime
from frappe.utils import time_diff_in_hours

class LeavePermission(Document):
    def after_insert(self):
        create_checkin_checkout(self)
        
    def validate(self):
        max_leave_times = 2

        # Calculate difference in hours
        leave_duration = time_diff_in_hours(self.return_time, self.leave_time)

        # Validate leave duration
        if leave_duration > max_leave_times:
            frappe.throw(f"Leave duration cannot exceed {max_leave_times} hours.")



def create_checkin_checkout(leave_permission):
    employee = leave_permission.employee
    date = leave_permission.date
    leave_time = leave_permission.leave_time
    return_time = leave_permission.return_time

    # Convert times to datetime format
    leave_datetime = get_datetime(f"{date} {leave_time}")
    return_datetime = get_datetime(f"{date} {return_time}")

    # Function to create a check-in/check-out using EmployeeCheckin class
    def create_checkin_entry(employee, time, log_type):
        checkin = frappe.new_doc("Employee Checkin")
        checkin.employee = employee
        checkin.time = time
        checkin.log_type = log_type
        checkin.skip_auto_attendance = 0  # Ensure attendance is processed
        checkin.insert(ignore_permissions=True)  # Save using the existing EmployeeCheckin class logic

    # Create IN and OUT check-ins
    create_checkin_entry(employee, leave_datetime, "IN")
    create_checkin_entry(employee, return_datetime, "OUT")

    frappe.db.commit()
    frappe.msgprint(f"Leave permission logged: Check-in at {leave_time}, Check-out at {return_time} for {employee}.")
