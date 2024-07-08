/*
* Initial project from:
* jquery-cronmaker: https://github.com/jxz032/jquery-cronmaker
* 
* 2024.07.03 - cjanged by Sergej Jegorov<sergej.jegorov@gmail.com>
*   use tabs from bootstrap v2
*   changed styles to use bootstrap v2
*   use jQuery Timepicker Addon - v1.6.3
*   fixed bug with ddlYearlyMonth -> ddlYearlyMonth2
*/
(function ($) {

    var PROP_NAME = 'cronmaker';
    var instActive;

    /*
    * Cronmaker manager.
    * Use the singleton instance of this class, $.cronmaker, to interact with the cronmaker.
    * Settings for (groups of) cronmaker are maintained in an instance object,
    * allowing multiple different settings on the same page.
    */
    var Cronmaker = function () {

        this._mainDivId = 'ui-cronmaker-div'; // The ID of the main cronmaker division
        this._inlineClass = 'ui-cronmaker-inline'; // The name of the inline marker class

        this.regional = []; // Available regional settings, indexed by language code
        this.regional[''] = { // Default regional settings
            everyText: 'Every',
            atText: 'At',
            minutesText: 'minute(s)',
            hoursText: 'hour(s)',
            dayText: 'Day',
            daysText: 'day(s)',
            monthsText: 'month(s)',
            everyWeekDayText: 'Every Week Day',
            theText: 'The',
            ofText: 'of',
            ofEveryText: 'of every',
            startTimeText: 'Start Time',
            generateCronExpressionText: 'Generate Cron Expression',
            timeText: 'Time',
            hourText: 'Hour',
            minuteText: 'Minute',
            timeFormat: 'HH:mm',
            isRTL: false
        };
        this._defaults = { // Global defaults for all instances
            lang: 'en',
        }
        $.extend(this._defaults, this.regional['']);
        this.dpDiv = $('<div id="' + this._mainDivId + '" class="ui-cronmaker ui-cronmaker-content ui-cronmaker-corner-all"></div>');
    };

    $.extend(Cronmaker.prototype, {
        //$input: null,
        /* Class name added to elements to indicate already configured with a date picker. */
        markerClassName: 'hasCronmaker',

        /* Override the default settings for all instances of the date picker.
           @param  settings  object - the new settings to use as defaults (anonymous object)
           @return the manager object */
        setDefaults: function (settings) {
            extendRemove(this._defaults, settings || {});
            return this;
        },

        /*
         * Create a new Cronmaker instance
         */
        _newInst: function (target) {
            var id = target[0].id.replace(/([^A-Za-z0-9_-])/g, '\\\\$1'); // escape jQuery meta chars

            var result = {
                id: id,         // associated element id
                input: target,  // associated target
                dpDiv:          // presentation div
                    $('<div class="' + this._inlineClass + ' ui-cronmaker ui-cronmaker-content ui-cronmaker-corner-all"></div>'),
            };
            return result;
        },

        /* Retrieve the instance data for the target control.
           @param  target  element - the target input field or division or span
           @return  object - the associated instance data
           @throws  error if a jQuery problem getting data */
        _getInst: function (target) {
            try {
                return $.data(target, PROP_NAME);
            }
            catch (err) {
                throw 'Missing instance data for this cronmaker';
            }
        },

        /* Attach the Cronmaker to a jQuery selection.
           @param  target    element - the target input field or division or span
           @param  settings  object - the new settings to use for this Cronmaker instance (anonymous) */
        _attachCronmaker: function (target, settings) {
            // check for settings on the control itself - in namespace 'date:'
            if (!target.id) {
                this.uuid += 1;
                target.id = 'cm' + this.uuid;
            }
            var inst = this._newInst($(target));
            inst.settings = $.extend({}, settings || {});
            this._inlineCronmaker(target, inst);
        },

        /* Attach an inline Cronmaker to a div. */
        _inlineCronmaker: function (target, inst) {
            var divSpan = $(target);
            if (divSpan.hasClass(this.markerClassName))
                return;
            divSpan.addClass(this.markerClassName).append(inst.dpDiv)
                //.bind("setData.cronmaker", function (event, key, value) {
                //    inst.settings[key] = value;
                //})
                //.bind("getData.cronmaker", function (event, key) {
                //    return this._get(inst, key);
                //})
                ;
            $.data(target, PROP_NAME, inst);
            this._updateCronmaker(inst);
        },

        /* Generate the Cronmaker content. */
        _updateCronmaker: function (inst) {
            instActive = inst; // for delegate hover events
            inst.dpDiv.empty().append(this._generateHTML(inst));
            this._reset(inst.settings.lang);
        },


        /* Get a setting value, defaulting if necessary. */
        _get: function (inst, name) {
            return inst.settings[name] !== undefined ?
                inst.settings[name] : this._defaults[name];
        },

        /* Generate the HTML for the current state of the cronmaker. */
        _generateHTML: function (inst) {
            var id = inst.id;
            var tabId = inst.id + '_Tabs';
            var buttonText = this._get(inst, 'generateCronExpressionText');

            return "<ul class='nav nav-pills' id='" + tabId + "'>"
                + " <li class='active'><a href='#" + tabId + "-Minutes' data-toggle='tab'>Minutes</a></li>"
                + " <li><a href='#" + tabId + "-Hourly' data-toggle='tab'>Hourly</a></li>"
                + " <li><a href='#" + tabId + "-Daily' data-toggle='tab'>Daily</a></li>"
                + " <li><a href='#" + tabId + "-Weekly' data-toggle='tab'>Weekly</a></li>"
                + " <li><a href='#" + tabId + "-Monthly' data-toggle='tab'>Monthly</a></li>"
                + " <li><a href='#" + tabId + "-Yearly' data-toggle='tab'>Yearly</a></li>"
                + "</ul>"
                + "<div class='tabbable' style='margin-bottom: 10px;'>"
                + " <div class='tab-content'>"
                + "     <div id='" + tabId + "-Minutes' class='tab-pane active'>" + this._createMinutesTab(inst) + "</div>"
                + "     <div id='" + tabId + "-Hourly' class='tab-pane'>" + this._createHourlyTab(inst) + "</div>"
                + "     <div id='" + tabId + "-Daily' class='tab-pane'>" + this._createDailyTab(inst) + "</div>"
                + "     <div id='" + tabId + "-Weekly' class='tab-pane'>" + this._createWeeklyTab(inst) + "</div>"
                + "     <div id='" + tabId + "-Monthly' class='tab-pane'>" + this._createMonthlyTab(inst) + "</div>"
                + "     <div id='" + tabId + "-Yearly' class='tab-pane'>" + this._createYearlyTab(inst) + "</div>"
                + " </div>"
                + "</div>"
                + "<hr/>"

                + "<div style='margin-top: 10px;'>"
                + ' <button type="button" class="btn" id="btnGenCron" onclick="$.cronmaker._calc(\'' + id.trim() + '\')"><i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;' + buttonText + '</button>'
                + " <label id='" + id + "_lblValidation' style='color: red; display: inline-block; float:right;'></label>"
                + " <div style='margin-top: 10px;'>"
                + "     <div class='input-prepend'>"
                + "         <span class='add-on'>CRON</span>"
                + "         <input type='text' name='CRON' id='CRON' value='' class='input-xlarge' />"
                + "     </div>"
                + " </div>"
                + "</div>"
                ;
        },

        _createMinutesTab: function (inst) {
            var id = inst.id;
            var everyText = this._get(inst, 'everyText');
            var minutesText = this._get(inst, 'minutesText');

            return "<div class='form-inline'>"
                + "     <label class='control-label'>" + everyText + " </label>"
                + "     <div class='input-append'>"
                + this._createMinutesDropDownList(inst, id + '_txtMin')
                + "         <span class='add-on'> " + minutesText + "</span>"
                + "     </div>"
                + "</div>"
                ;
        },

        _createHourlyTab: function (inst) {
            var id = inst.id;
            var everyText = this._get(inst, 'everyText');
            var atText = this._get(inst, 'atText');
            var hoursText = this._get(inst, 'hoursText');

            return "<div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='hour' value='frequence' checked />" + everyText + '&nbsp;'
                + "     </label>"
                + "     <div class='input-append'>"
                + this._createHourDropDownList(inst, id + '_txtEveryHours')
                + "         <span class='add-on'>" + hoursText + "</span>"
                + "     </div>"
                + " </div>"
                + "<br />"
                + " <div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='hour' value='time' checked />" + atText + '&nbsp;'
                + "     </label>"
                + "     <input type='text' id='" + id + "_txtHourlyAtTime' class='input-small timepicker' />"
                + "</div>"
                ;
        },

        _createDailyTab: function (inst) {
            var id = inst.id;
            var everyText = this._get(inst, 'everyText');
            var everyWeekDayText = this._get(inst, 'everyWeekDayText');
            var startTimeText = this._get(inst, 'startTimeText');
            var daysText = this._get(inst, 'daysText');

            return "<div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='daily' value='frequence' checked/>" + everyText + '&nbsp;'
                + "     </label>"
                + "     <div class='input-append'>"
                + "         <input type='number' id='" + id + "_txtEveryDays' class='input-mini' min='1' max='31' placeholder='1..31'/>"
                + "         <span class='add-on'>" + daysText + "</span>"
                + "     </div>"
                + " </div>"
                + "<br />"
                + " <div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='daily' value='time' />" + everyWeekDayText + '&nbsp;'
                + "     </label>"
                + " </div>"
                + "<br />"
                + " <div class='input-prepend'>"
                + "     <span class='add-on'>" + startTimeText + "</span>"
                + "     <input type='text' id='" + id + "_txtDailyAtTime'class='input-small timepicker' />"
                + " </div>"
                ;
        },

        _createWeeklyTab: function (inst) {
            var id = inst.id;
            var startTimeText = this._get(inst, 'startTimeText');

            return "<label class='checkbox'><input type='checkbox' name='weekly' value='MON' />Monday</label>"
                + "<label class='checkbox'><input type='checkbox' name='weekly' value='TUE' />Tuesday</label>"
                + "<label class='checkbox'><input type='checkbox' name='weekly' value='WED' />Wednesday</label>"
                + "<label class='checkbox'><input type='checkbox' name='weekly' value='THU' />Thursday</label>"
                + "<label class='checkbox'><input type='checkbox' name='weekly' value='FRI' />Friday</label>"
                + "<label class='checkbox'><input type='checkbox' name='weekly' value='SAT' />Saturday</label>"
                + "<label class='checkbox'><input type='checkbox' name='weekly' value='SUN' />Sunday</label>"
                + " <div class='input-prepend'>"
                + "     <span class='add-on'>" + startTimeText + "</span>"
                + "     <input type='text' id='" + id + "_txtWeeklyAtTime'class='input-small timepicker' />"
                + " </div>"
                ;
        },

        _createMonthlyTab: function (inst) {
            var id = inst.id;
            var dayText = this._get(inst, 'dayText');
            var monthsText = this._get(inst, 'monthsText');
            var ofEveryText = this._get(inst, 'ofEveryText');
            var theText = this._get(inst, 'theText');
            var startTimeText = this._get(inst, 'startTimeText');

            return "<div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='monthly' value='day' checked/>" + dayText + '&nbsp;'
                + "     </label>"
                + "     <input type='number' id='" + id + "_txtMonthlyDay' class='input-mini' min='1' max='31' placeholder='1..31'/>"
                + "     <label class='light'> " + ofEveryText + " </label>"
                + "     <div class='input-append'>"
                + this._createNthMonthDropDownList(inst, id + '_txtMonthlyMonth')
                + "         <span class='add-on'>" + monthsText + "</span>"
                + "     </div>"
                + "</div>"
                + "<br />"
                + "<div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='monthly' value='weekday'/>" + theText + '&nbsp;'
                + "     </label>"
                + this._createNthDropDownList(inst, id + '_ddlMonthlyNth')
                + this._createWeekDropDownList(inst, id + '_ddlMonthlyWeekDay')
                + "     <label class='light'> " + ofEveryText + " </label>"
                + "     <div class='input-append'>"
                + this._createNthMonthDropDownList(inst, id + '_txtMonthlyMonth2')
                + "         <span class='add-on'>" + monthsText + "</span>"
                + "     </div>"
                + "</div>"
                + "<br />"
                + "<div class='input-prepend'>"
                + "     <span class='add-on'>" + startTimeText + "</span>"
                + "     <input type='text' id='" + id + "_txtMonthlyAtTime'class='input-small timepicker' />"
                + "</div>"
                ;
        },

        _createYearlyTab: function (inst) {
            var id = inst.id;
            var everyText = this._get(inst, 'everyText');
            var theText = this._get(inst, 'theText');
            var ofText = this._get(inst, 'ofText');
            var startTimeText = this._get(inst, 'startTimeText');

            return "<div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='yearly' value='everyDate' />" + everyText + '&nbsp;'
                + "     </label>"
                + this._createMonthDropDownList(inst, id + '_ddlYearlyMonth')
                + "     <input type='number' id='" + id + "_txtYearlyDay' class='input-mini' min='1' max='31' placeholder='1..31' />"
                + "</div>"
                + "<br />"
                + "<div class='form-inline'>"
                + "     <label class='radio'>"
                + "         <input type='radio' name='yearly' value='weekday' checked />" + theText + '&nbsp;'
                + "     </label>"
                + this._createNthDropDownList(inst, id + '_ddlYearlyNth')
                + "&nbsp;"
                + this._createWeekDropDownList(inst, id + '_ddlYearlyWeekDay')
                + "     <label class='light'>&nbsp;" + ofText + "&nbsp;</label>"
                + this._createMonthDropDownList(inst, id + '_ddlYearlyMonth2')
                + "</div>"
                + "<br />"
                + "<div class='input-prepend'>"
                + "     <span class='add-on'>" + startTimeText + "</span>"
                + "     <input type='text' id='" + id + "_txtYearlyAtTime' class='input-small timepicker' />"
                + "</div>"
                ;
        },

        _createMinutesDropDownList: function (inst, id) {

            return "<select id='" + id + "' class='input-mini'>"
                + "     <option value='1'>1</option>"
                + "     <option value='2'>2</option>"
                + "     <option value='3'>3</option>"
                + "     <option value='4'>4</option>"
                + "     <option value='5'>5</option>"
                + "     <option value='6'>6</option>"
                + "     <option value='10'>10</option>"
                + "     <option value='15'>15</option>"
                + "     <option value='20' selected='selected'>20</option>"
                + "     <option value='30'>30</option>"
                + "</select>";
        },

        _createHourDropDownList: function (inst, id) {

            return "<select id='" + id + "' class='input-mini'>"
                + "     <option value='1' selected='selected'>1</option>"
                + "     <option value='2'>2</option>"
                + "     <option value='3'>3</option>"
                + "     <option value='4'>4</option>"
                + "     <option value='6'>6</option>"
                + "     <option value='12'>12</option>"
                + "</select>";
        },

        _createWeekDropDownList: function (inst, id) {

            return "<select id='" + id + "' class='input-small'>"
                + "     <option value='MON' selected='selected'>Monday</option>"
                + "     <option value='TUE'>Tuesday</option>"
                + "     <option value='WED'>Wednesday</option>"
                + "     <option value='THU'>Thursday</option>"
                + "     <option value='FRI'>Friday</option>"
                + "     <option value='SAT'>Saturday</option>"
                + "     <option value='SUN'>Sunday</option>"
                + "</select>";
        },

        _createNthMonthDropDownList: function (inst, id) {

            return "<select id='" + id + "' class='input-mini'>"
                + "     <option value='1' selected='selected'>1</option>"
                + "     <option value='2'>2</option>"
                + "     <option value='3'>3</option>"
                + "     <option value='4'>4</option>"
                + "     <option value='6'>6</option>"
                + "</select>";
        },

        _createNthDropDownList: function (inst, id) {

            return "<select id='" + id + "' class='input-small'>"
                + "     <option value='1' selected='selected'>First</option>"
                + "     <option value='2'>Second</option>"
                + "     <option value='3'>Third</option>"
                + "     <option value='4'>Fourth</option>"
                + "</select>";
        },

        _createMonthDropDownList: function (inst, id) {

            return "<select id='" + id + "' class='input-small'>"
                + "     <option value='1' selected='selected'>January</option>"
                + "     <option value='2'>February</option>"
                + "     <option value='3'>March</option>"
                + "     <option value='4'>April</option>"
                + "     <option value='5'>May</option>"
                + "     <option value='6'>June</option>"
                + "     <option value='7'>July</option>"
                + "     <option value='8'>August</option>"
                + "     <option value='9'>September</option>"
                + "     <option value='10'>October</option>"
                + "     <option value='11'>November</option>"
                + "     <option value='12'>December</option>"
                + "</select>";
        },

        _getCurrentTab: function (id) {
            var tabId = "ul#" + id + " li.active";
            var tab = $(tabId);
            var currentTab = tab[0].innerText;
            return currentTab;
        },

        _reset: function (lang) {
            $("#CRON").attr('value', '');
            $(".timepicker").timepicker($.timepicker.regional[lang]);
            $(".timepicker").timepicker('setTime', new Date());
        },

        _printResult: function (secs, mins, hours, dayOfMonth, month, dayOfWeek, year) {
            var generatedCron = [secs, mins, hours, dayOfMonth, month, dayOfWeek, year];
            $("#CRON").attr('value', generatedCron.join(' '));
        },

        _calc: function (id) {
            var tabId = id + '_Tabs';
            var currTab = this._getCurrentTab(tabId);
            var rdoType;
            var chbType = [];
            var time;
            var txtday, txtmonth;
            var nth, selectWorkDay;
            var secs, mins, hours, dayOfMonth, month, dayOfWeek, year;

            if (currTab == "Minutes") {
                secs = 0;
                mins = $("#" + id + "_txtMin").val();
                hours = "*";
                dayOfMonth = "1/1";
                month = "*";
                dayOfWeek = "?";
                year = "*";

                if (mins == "" || mins == 0) {
                    $("#" + id + "_lblValidation").html("Minimum minutes should be 1.");
                } else {
                    $("#" + id + "_lblValidation").html('');
                    this._printResult(secs, '0/' + mins, hours, dayOfMonth, month, dayOfWeek, year);
                }
            } else if (currTab == "Hourly") {
                rdoType = $("input[name='hour']:checked").val();

                if (rdoType == "frequence") {
                    secs = 0;
                    mins = 0;
                    hours = "0/" + $("#" + id + "_txtEveryHours").val();
                    dayOfMonth = "1/1";
                    month = "*";
                    dayOfWeek = "?";
                    year = "*";

                    if (hours == "0/") {
                        $("#" + id + "_lblValidation").html("Minimum hours should be 1.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                } else { //chose time
                    time = $("#" + id + "_txtHourlyAtTime").val().split(":");
                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = "1/1";
                    month = "*";
                    dayOfWeek = "?";
                    year = "*";
                    $("#" + id + "_lblValidation").html("");
                    this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                }
            } else if (currTab == "Daily") {
                rdoType = $("input[name='daily']:checked").val();

                if (rdoType == "frequence") {
                    time = $("#" + id + "_txtDailyAtTime").val().split(":");

                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = "1/" + $("#" + id + "_txtEveryDays").val();
                    month = "*";
                    dayOfWeek = "?";
                    year = "*";

                    if (dayOfMonth == "1/") {
                        $("#" + id + "_lblValidation").html("Minimum days should be 1.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                } else { //chose weekday
                    time = $("#" + id + "_txtDailyAtTime").val().split(":");
                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = "?";
                    month = "*";
                    dayOfWeek = "MON-FRI";
                    year = "*";

                    if (dayOfMonth == "1/") {
                        $("#" + id + "_lblValidation").html("Minimum days should be 1.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                }
            } else if (currTab == "Weekly") {
                $("input[name='weekly']:checked").each(function () {
                    chbType.push($(this).val());
                });

                time = $("#" + id + "_txtDailyAtTime").val().split(":");
                secs = 0;
                mins = Number(time[1]);
                hours = Number(time[0]);
                dayOfMonth = "?";
                month = "*";
                dayOfWeek = chbType.join(",");
                year = "*";

                if (dayOfWeek == "") {
                    $("#" + id + "_lblValidation").html("Field 'Days selection' is required.");
                } else {
                    $("#" + id + "_lblValidation").html("");
                    this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                }
            } else if (currTab == "Monthly") {
                rdoType = $("input[name='monthly']:checked").val();

                if (rdoType == "day") {
                    txtday = $("#" + id + "_txtMonthlyDay").val();
                    txtmonth = $("#" + id + "_txtMonthlyMonth").val();

                    time = $("#" + id + "_txtMonthlyAtTime").val().split(":");
                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = txtday;
                    month = "1/" + txtmonth;
                    dayOfWeek = "?";
                    year = "*";

                    if (txtday == "" || txtmonth == "") {
                        $("#" + id + "_lblValidation").html("Field 'Day' and 'every month(s)' are required.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                } else {
                    nth = $("#" + id + "_ddlMonthlyNth").val();
                    selectWorkDay = $("#" + id + "_ddlMonthlyWeekDay").val();
                    txtmonth = $("#" + id + "_txtMonthlyMonth2").val();

                    time = $("#" + id + "_txtMonthlyAtTime").val().split(":");
                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = "?";
                    month = "1/" + txtmonth;
                    dayOfWeek = selectWorkDay + "#" + nth;
                    year = "*";

                    if (txtmonth == "") {
                        $("#" + id + "_lblValidation").html("Field 'every month(s)' is required.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                }
            } else if (currTab == "Yearly") {
                rdoType = $("input[name='yearly']:checked").val();

                if (rdoType == "everyDate") {
                    txtday = $("#" + id + "_txtYearlyDay").val();
                    txtmonth = $("#" + id + "_ddlYearlyMonth").val();

                    time = $("#" + id + "_txtYearlyAtTime").val().split(":");
                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = txtday;
                    month = txtmonth;
                    dayOfWeek = "?";
                    year = "*";

                    if (txtday == "") {
                        $("#" + id + "_lblValidation").html("Field 'Day' is required.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                } else {
                    nth = $("#" + id + "_ddlYearlyNth").val();
                    selectWorkDay = $("#" + id + "_ddlYearlyWeekDay").val();
                    txtmonth = $("#" + id + "_ddlYearlyMonth2").val();

                    time = $("#" + id + "_txtYearlyAtTime").val().split(":");
                    secs = 0;
                    mins = Number(time[1]);
                    hours = Number(time[0]);
                    dayOfMonth = "?";
                    month = txtmonth;
                    dayOfWeek = selectWorkDay + "#" + nth;
                    year = "*";

                    if (txtmonth == "") {
                        $("#" + id + "_lblValidation").html("Field 'every month(s)' is required.");
                    } else {
                        $("#" + id + "_lblValidation").html("");
                        this._printResult(secs, mins, hours, dayOfMonth, month, dayOfWeek, year);
                    }
                }
            }
        },

    });

    /*
    * Create a Singleton Instance
    */
    $.cronmaker = new Cronmaker();
    $.cronmaker.initialized = false;
    $.cronmaker.uuid = new Date().getTime();
    /*
    * Keep up with the version
    */
    $.cronmaker.version = "1.0.0";

    // Plugin definition.
    /* Invoke the cronmaker functionality.
      @param  options  string - a command, optionally followed by additional parameters or
                       Object - settings for attaching new cronmaker functionality
      @return  jQuery object */
    $.fn.cronmaker = function (options) {
        /* Verify an empty collection wasn't passed */
        if (!this.length) {
            return this;
        }
        /* Initialise the cronmaker. */
        if (!$.cronmaker.initialized) {
            $.cronmaker.initialized = true;
        }

        var otherArgs = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            typeof options == 'string' ?
                $.cronmaker['_' + options + 'Cronmaker'].
                    apply($.cronmaker, [this].concat(otherArgs)) :
                $.cronmaker._attachCronmaker(this, options);
        });
    };

    // Plugin defaults - added as a property on our plugin function.
    $.fn.cronmaker.defaults = {
        lang: 'en',
    };

    /* jQuery extend now ignores nulls! */
    function extendRemove(target, props) {
        $.extend(target, props);
        for (var name in props)
            if (props[name] == null || props[name] == undefined)
                target[name] = props[name];
        return target;
    };

}(jQuery));
