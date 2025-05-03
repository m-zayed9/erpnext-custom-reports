frappe.query_reports["Custom Attendance"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			reqd: 1,
			default: frappe.datetime.month_start(),
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			reqd: 1,
			default: frappe.datetime.month_end(),
		},
		{
			fieldname: "employee",
			label: __("Employee"),
			fieldtype: "Link",
			options: "Employee",
		},
		{
			fieldname: "shift",
			label: __("Shift Type"),
			fieldtype: "Link",
			options: "Shift Type",
		},
		{
			fieldname: "department",
			label: __("Department"),
			fieldtype: "Link",
			options: "Department",
		},
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			reqd: 1,
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "late_entry",
			label: __("Late Entry"),
			fieldtype: "Check",
		},
		{
			fieldname: "early_exit",
			label: __("Early Exit"),
			fieldtype: "Check",
		},
		{
			fieldname: "consider_grace_period",
			label: __("Consider Grace Period"),
			fieldtype: "Check",
			default: 1,
		},
	],

	formatter: (value, row, column, data, default_formatter) => {
		value = default_formatter(value, row, column, data);
		if (
			(column.fieldname === "in_time" && data.late_entry) ||
			(column.fieldname === "out_time" && data.early_exit)
		) {
			value = `<span style='color:red!important'>${value}</span>`;
		}

		if (column.fieldname == 'penality') {
			checked = "";
			if(row[12].content || row[13].content)
				checked = 'checked'
			value = `<input type="checkbox" ${checked} class="apply-penalty" 
					 data-employee="${row[1].content}"  
					 data-lateEntry="${row[12].content}"  
					 data-earlyExit="${row[13].content}"
					 data-date="${row[4].content}" >`;
		}
		return value;
	},

	onload: function(report) {
		report.page.add_inner_button(__('Apply Penalty to Selected'), function() {
			apply_penalty_to_selected();
		}, 'Actions');
	},

};

function apply_penalty(employee, penalty_type, penalty_time, checkbox , date) {
	frappe.call({
		method: "custom_reports.custom_reports.report.custom_attendance.custom_attendance.apply_penalty",
		args: {
			employee: employee,
			penalty_type: penalty_type,
			penalty_time: penalty_time,
			date,
		},
		callback: function(r) {
			if (r.message) {
				frappe.msgprint(r.message);
				checkbox.prop('disabled', true);
			}
		}
	});
}

function apply_penalty_to_selected() {
	let selected_rows = $('.apply-penalty:checked');

	if (selected_rows.length === 0) {
		frappe.msgprint(__('Please select at least one employee to apply penalty.'));
		return;
	}

	frappe.confirm(
		__("Are you sure you want to apply penalties to the selected employees?"),
		function() {
			selected_rows.each(function() {
				let checkbox = $(this);
				let employee = checkbox.attr('data-employee');
				let late_entry = checkbox.attr('data-lateEntry');
				let early_exit = checkbox.attr('data-earlyExit');
				let date = checkbox.attr('data-date');

				if (late_entry !== 'undefined') {
					apply_penalty(employee, 'late_entry', late_entry, checkbox , date);
				}

				if (early_exit !== 'undefined') {
					apply_penalty(employee, 'early_exit', early_exit, checkbox, date);
				}
			});
		}
	);
}
