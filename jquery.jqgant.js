// jQuery Plugin Boilerplate
// A boilerplate for jumpstarting jQuery plugins development
// version 1.1, May 14th, 2011
// by Stefan Gabos

(function($) {

    $.jqgant = function(element, options) {

        var defaults = {
            foo: 'bar',
	    tasklist: {tasks:[{"name":"task1", "duration":"5 days", "start_date":"07/23/2012", "end_date":"07/26/2012"},
	    {"name":"task2", "duration":"3 days", "start_date":"08/01/2012", "end_date":"08/03/2012"}]},
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
        plugin.build_chart = function() {
		var jqgantdiv = $("<div>").attr({"class":"jqgantdiv"});
		grid_start_date = get_start_date();
		add_task_list(jqgantdiv);
		var weeklabels = ["Jun 15, '12", "Jun 22, '12", "Jun 29, '12"];
		var cellgrid = $("<div />", {class:"cellcontainer"});
		add_cell_headers(cellgrid, weeklabels);
		add_cells(cellgrid);
		jqgantdiv.append(cellgrid);
		$element.append(jqgantdiv);
		draw_tasks();
        }

	// return the First sunday before the earliest task start date
	//  or a week ago if there are no tasks or tasks are in the future
	var get_start_date = function() {
		d = new Date();
		for ( var t in plugin.settings.tasklist.tasks )
		{
			if ( plugin.settings.tasklist.tasks[t].start_date < d )
			{
				d = plugin.settings.tasklist.tasks[t].start_date;
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
				  plugin.settings.tasklist.tasks[t].end_date); 

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

	var draw_task_bar = function(task_id, start_date, end_date ) {
		start = new Date(start_date);
		end = new Date(end_date);
		diff = new TimeSpan(start - grid_start_date);
		// remove weekends from time span // need to fix this // bugs here
		start_index = diff.getDays() - ( 2 * Math.floor(diff.getDays() / 7 ));
		diff = new TimeSpan(end - start);
		length = (diff.getDays()+1) * 22;

		$("#cell_" + task_id + "_" + start_index).append("<div id='task" + task_id + "' class='taskbar' style='width: " + length + "px'></div>");
		$("#task" + task_id).data('task_id', task_id);
		$("#task" + task_id).data('start_date', start_date);
		var wndHeight = $(window).height();
		$("#task" + task_id).resizable({stop: function(event, ui) {
					// force resize to end up on a day boundary
					$(event.target).width( Math.floor($(event.target).width() / 22) * 22 + 22);
					update_task($(event.target).data('task_id'), 
							new Date($(event.target).data('start_date')),
						       	Math.floor($(event.target).width() / 22));
					}});
		$("#task" + task_id).draggable({axis: "x",
					stop: function(event, ui) {
						// snap to borders
						$(event.target).offset({left: Math.floor($(event.target).offset().left / 22) * 22 + 22 - $(".cellcontainer").scrollLeft() %22,
									top: $(event.target).offset().top});	
						update_task($(event.target).data('task_id'),
							add_workdays_to_date(grid_start_date, 
								Math.floor(($(event.target).offset().left -
									$("#cell_0_0").offset().left  )/ 22)),
							Math.floor($(event.target).width() / 22));	
							}});
	}

	var add_cell_headers = function(div, week_labels) {
		// draw a label for each week
		for ( x = 0; x<grid_width / 5; x++)
		{
			d = new Date();
			d.setDate( grid_start_date.getDate() + (x*7));
			div.append( $("<div />", { class:"jqgant_week_label" , text: d.toDateString() }));
		}
		div.append("<br />");
		for( x=0; x<grid_width/5; x++)
		{
			var days_of_week = ["M","T","W","T","F"];
			for(i in days_of_week)
			{
				div.append( $("<div />", { class:"jqgant_cell", text: days_of_week[i]}));
			}
		}
		div.append("<br />");
	}

	var add_cells = function(div) {
		for ( i=0; i< grid_height; i++)
		{
			for ( x=0; x< grid_width; x++)
			{
				div.append($("<div />", {id:"cell_" + i + "_" + x, class:"jqgant_cell"}));
			}
			div.append("<br />");
		}
	}

        var add_task_list = function(div) {
	    var task_table = $("<table />", {"id":"jqgant_task_table"});
	    task_table.append("<tr><th>Task</th><th>Duration</th><th>Start Date</th><th>End Date</th></tr>");
            for ( var t in plugin.settings.tasklist.tasks )
	    {
		var task_row = $("<tr />");
		task_row.append( $("<td />", {"text": plugin.settings.tasklist.tasks[t].name}));
		task_row.append( $("<td />", {"id": "task" + t + "_duration", "text": plugin.settings.tasklist.tasks[t].duration}));
		task_row.append( $("<td />", {"id": "task" + t + "_start_date", "text": plugin.settings.tasklist.tasks[t].start_date}));
		task_row.append( $("<td />", {"id": "task" + t + "_end_date", "text": plugin.settings.tasklist.tasks[t].end_date}));
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

