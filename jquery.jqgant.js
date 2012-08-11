// jQuery Plugin Boilerplate
// A boilerplate for jumpstarting jQuery plugins development
// version 1.1, May 14th, 2011
// by Stefan Gabos

(function($) {

    $.jqgant = function(element, options) {

        var defaults = {
            foo: 'bar',
	    tasklist: {tasks:[{"name":" long task1", "duration":"5 days", "start_date":"07/23/2012", "end_date":"07/26/2012", "pct_completion": 0},
	    {"name":"task2", "duration":"3 days", "start_date":"08/01/2012", "end_date":"08/03/2012", "pct_completion":0},
	    {"name":"do stuff", "duration": "4 days", "start_date":"8/5/2012", "end_date":"8/9/2012", "pct_completion":50},
	    {"name":"This is the default task list", "duration": "5 days", "start_date":"8/7/2012", "end_date":"8/9/2012", "pct_completion":10} 
	    ]},
            onFoo: function() {}
        }

        var plugin = this;

        plugin.settings = {}

        var $element = $(element),
             element = element;

        plugin.init = function() {
            plugin.settings = $.extend({}, defaults, options);
            // code goes here
        }

	var grid_width = 365;
	var grid_height = 2;
	var grid_start_date = new Date();
	var CELL_WIDTH = 22;

        plugin.build_chart = function() {
		var jqgantdiv = $("<div>").attr({"class":"jqgantdiv"});
		grid_start_date = get_start_date();
		grid_height = plugin.settings.tasklist.tasks.length;
		add_task_list(jqgantdiv);
		var cellgrid = $("<div />", {"class":"cellcontainer"});
		add_cell_headers(cellgrid);
		add_cells(cellgrid);
		jqgantdiv.append(cellgrid);
		$element.append(jqgantdiv);
		draw_tasks();
        }

	plugin.add_task = function(task) {
		plugin.settings.tasklist.tasks.push(task);
		$(".jqgantdiv").empty();
		plugin.build_chart();
	}

	plugin.remove_task = function(index) {
		plugin.settings.tasklist.tasks.splice(index,1);
		$(".jqgantdiv").empty();
		plugin.build_chart();
	}

	// return the First sunday before the earliest task start date
	//  or a week ago if there are no tasks or tasks are in the future
	var get_start_date = function() {
		d = new Date();
		for ( var t in plugin.settings.tasklist.tasks )
		{
			if ( Date.parse(plugin.settings.tasklist.tasks[t].start_date) < d )
			{
				d = Date.parse(plugin.settings.tasklist.tasks[t].start_date);
			}
		}
	        d.setDate(d.getDate() - d.getDay() + 1)	
		return d;
	}

	var draw_tasks = function() {
	    for ( var t in plugin.settings.tasklist.tasks )
	    {
		    draw_task_bar(t,
				  plugin.settings.tasklist.tasks[t].start_date,
				  plugin.settings.tasklist.tasks[t].end_date,
				  plugin.settings.tasklist.tasks[t].pct_completion); 

	    }
	}

	// utility function that adds a number of workdays to the date
	// takes into account weekends.
	var add_workdays_to_date = function(start_date, num_workdays) {
		num_days = num_workdays;
		if ( start_date.getDay() + num_workdays < 6)
		{
			// don't need to add any weekends
		}	
		else
		{
			// add the weekends
			num_days = num_days +  2 * Math.floor(num_days / 5);
			if ( num_workdays % 5 + start_date.getDay() > 5)
			{
				num_days += 2;
			}
		}
		d = new Date(start_date);
		return d.addDays(num_days);
	}

	// get # of workdays between 2 dates
	var diff_workdays = function(start, end ) {
		duration = new TimeSpan(end - start);
		num_days = duration.getDays();
		if ( (num_days % 7) + start.getDay() > 5 )
		       num_days = num_days - 2;	
		num_days = num_days - ( 2 * Math.floor(num_days / 7 ));
		if ( num_days != 0)
			num_days = num_days + 1;
		return num_days;
	}

	// this function is called to update the json task object 
	// and update the task table
	var update_task = function(task_id, start_date, duration){
		plugin.settings.tasklist.tasks[task_id].duration = duration + " days";
		$('#task' + task_id + "_duration").text(duration + " days"); 
		plugin.settings.tasklist.tasks[task_id].start_date = start_date;
	
		plugin.settings.tasklist.tasks[task_id].start_date = start_date.toString('M/d/yyyy');
		$('#task' + task_id + "_start_date").text(start_date.toString('M/d/yyyy'));

		end_date = add_workdays_to_date(start_date, duration-1);
		plugin.settings.tasklist.tasks[task_id].end_date = end_date.toString('M/d/yyyy');
		$('#task' + task_id + "_end_date").text(end_date.toString('M/d/yyyy'));

		$("#task" + task_id).data('start_date', start_date);
	}

	var draw_task_bar = function(task_id, start_date, end_date, pct_completion ) {
		start = new Date(start_date);
		end = new Date(end_date);
		
		start_index = diff_workdays(grid_start_date, start);
		if (start_index > 0)
			start_index = start_index - 1;
		workdays = diff_workdays(start, end);
		var length = (workdays ) * CELL_WIDTH;
		$("#cell_" + task_id + "_" + start_index).append("<div id='task" + task_id + "' class='taskbar' style='width: " + length + "px'></div>");
		$("#task" + task_id).data('task_id', task_id);
		$("#task" + task_id).data('start_date', start_date);
		var wndHeight = $(window).height();

		// set percent completion gradient
		
		$("#task" + task_id).css('background-image', '-webkit-linear-gradient(left, red ' + String(pct_completion ) + '%, blue ' + pct_completion + '%)');
		$("#task" + task_id).css('background-image', '-moz-linear-gradient(left, red ' + String(pct_completion) + '%, blue ' + pct_completion + '%)');
		$("#task" + task_id).resizable({

			start: function(event, ui) {        

  			  },
			stop: function(event, ui) {
					// force resize to end up on a day boundary
					$(event.target).width( Math.floor($(event.target).width() / CELL_WIDTH) * CELL_WIDTH + CELL_WIDTH);
					update_task($(event.target).data('task_id'), 
							new Date($(event.target).data('start_date')),
						       	Math.floor($(event.target).width() / CELL_WIDTH));
					$(event.target).attr('position', 'relative');
					}});
		$("#task" + task_id).draggable({containment: $(".cellcontainer"), axis: "x",
					stop: function(event, ui) {
						// snap to borders
						$(event.target).offset({left: Math.floor(($(event.target).offset().left - $("#cell_0_0").offset().left) / CELL_WIDTH) * CELL_WIDTH + CELL_WIDTH  + $("#cell_0_0").offset().left,
									top: $(event.target).offset().top});	
						update_task($(event.target).data('task_id'),
							add_workdays_to_date(grid_start_date, 
								Math.floor(($(event.target).offset().left -
									$("#cell_0_0").offset().left  )/ CELL_WIDTH)),
							Math.floor($(event.target).width() / CELL_WIDTH));	
							}});
	}

	var add_cell_headers = function(div) {
		// draw a label for each week
		for ( x = 0; x<grid_width / 5; x++)
		{
			d = new Date(grid_start_date);
			d.setDate( d.getDate() + (x*7));
			div.append( $("<div />", { "class":"jqgant_week_label" , text: d.toDateString().substring(4) }));
		}
		div.append("<br />");
		for( x=0; x<grid_width/5; x++)
		{
			var days_of_week = ["M","T","W","T","F"];
			for(i in days_of_week)
			{
				div.append( $("<div />", { "class":"jqgant_cell", text: days_of_week[i]}));
			}
		}
		div.append("<br />");
	}

	var add_cells = function(div) {
		for ( i=0; i< grid_height; i++)
		{
			for ( x=0; x< grid_width; x++)
			{
				div.append($("<div />", {id:"cell_" + i + "_" + x, "class":"jqgant_cell"}));
			}
			div.append("<br />");
		}
	}

        var add_task_list = function(div) {
	    var task_table = $("<table />", {"id":"jqgant_task_table"});
	    task_table.append("<tr><th>Task</th><th>Duration</th><th>Start Date</th><th>End Date</th><th>% Complete</th></tr>");
            for ( var t in plugin.settings.tasklist.tasks )
	    {
		var task_row = $("<tr />");
		task_row.append( $("<td />", {"text": plugin.settings.tasklist.tasks[t].name}));
		task_row.append( $("<td />", {"id": "task" + t + "_duration", "text": plugin.settings.tasklist.tasks[t].duration}));
		task_row.append( $("<td />", {"id": "task" + t + "_start_date", "text": plugin.settings.tasklist.tasks[t].start_date}));
		task_row.append( $("<td />", {"id": "task" + t + "_end_date", "text": plugin.settings.tasklist.tasks[t].end_date}));
		
		// display select box for the completion percentage
		var completion_td =  $("<td />", {"id": "task" + t + "_completion_pct"});
		var completion_select = $("<select />");
		selectValues = {}
		for ( i=0; i<=100; i++)
		{
			selectValues[i] = i;
		}
		completion_select.attr("id", "task" + t + "_completion_select");
		$.each(selectValues, function(key, value) {   
     			completion_select
         		.append($("<option></option>")
         		.attr("value",key)
         		.text(value)); 
		});
		completion_select.val(plugin.settings.tasklist.tasks[t].pct_completion);
		completion_select.change(function(t) { return function() {
			plugin.settings.tasklist.tasks[t].pct_completion = $(this).val();
			$("#task" + t).remove();
			draw_task_bar(t, 
				plugin.settings.tasklist.tasks[t].start_date,
				plugin.settings.tasklist.tasks[t].end_date,
				$(this).val());
		};
		}(t));
		completion_td.append(completion_select);
		task_row.append(completion_td);
		task_table.append(task_row)
	    }
	    div.append(task_table);
        }

        plugin.init();

    }

    $.fn.jqgant = function(options) {

        return this.each(function() {
            if (undefined == $(this).data('jqgant')) {
                var plugin = new $.jqgant(this, options);
                $(this).data('jqgant', plugin);
            }
        });

    }

})(jQuery);

