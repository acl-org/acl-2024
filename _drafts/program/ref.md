---
title: Conference Schedule
layout: schedule
excerpt: "NAACL 2019 conference schedule."
permalink: /ref
sidebar: false
script: |
    <script type="text/javascript">

        sessionInfoHash = {};
        paperInfoHash = {};
        chosenPapersHash = {};
        chosenTutorialsHash = {};
        chosenWorkshopsHash = {};
        chosenPostersHash = {};
        plenarySessionHash = {};
        includePlenaryInSchedule = true;
        helpShown = false;

        var instructions = "<div id=\"popupInstructionsDiv\"><div id=\"title\">Help</div><div id=\"popupInstructions\"><ul><li>Click on a the \"<strong>+</strong>\" button or the title of a session to toggle it. Click the <strong>\"Expand All Sessions ↓\"</strong> button to expand <em>all</em> sessions in one go. Click again to collapse them. </li> <li>Click on a tutorial/paper/poster to toggle its selection. </li> <li>You can select more than one paper for a time slot. </li> <li>Click the &nbsp;<i class=\"fa fa-file-pdf-o\" aria-hidden=\"true\"></i>&nbsp; /&nbsp;<i class=\"fa fa-file-video-o\" aria-hidden=\"true\"></i>&nbsp; icon(s) for the PDF / Video. </li> <li>Click the <strong>\"Download PDF\"</strong> button at the bottom to download your customized PDF. </li> <li>To expand parallel sessions simultaneously, hold Shift and click on any of them. </li> <li>On non-mobile devices, hovering on a paper for a time slot highlights it in yellow and its conflicting papers in red. Hovering on papers already selected for a time slot (or their conflicts) highlights them in green. </li> <li>Hover over the time for any session to see its day and date as a tooltip.</li> <li>While saving the generated PDF on mobile devices, its name cannot be changed.</li> </ul></div></div>";

        function padTime(str) {
            return String('0' + str).slice(-2);
        }

        function formatDate(dateObj) {
            return dateObj.toLocaleDateString() + ' ' + padTime(dateObj.getHours()) + ':' + padTime(dateObj.getMinutes());
        }

        function generatePDFfromTable() {

            /* clear the hidden table before starting */
            clearHiddenProgramTable();

            /* now populate the hidden table with the currently chosen papers */
            populateHiddenProgramTable();

            var doc = new jsPDF('l', 'pt', 'letter');
            doc.autoTable({
                fromHtml: "#hidden-program-table",
                pagebreak: 'avoid',
                avoidRowSplit: true,
                theme: 'grid',
                startY: 70, 
                showHead: false,
                styles: {
                    font: 'times',
                    overflow: 'linebreak',
                    valign: 'middle',
                    lineWidth: 0.4,
                    fontSize: 11
                },
                 columnStyles: {
                    0: { fontStyle: 'bold', halign: 'right', cellWidth: 70 },
                    1: { cellWidth: 110 },
                    2: { fontStyle: 'italic', cellWidth: 530 }
                },
                addPageContent: function (data) {
                    /* HEADER only on the first page */
                    var pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

                    if (pageNumber == 1) {
                        doc.setFontSize(16);
                        doc.setFontStyle('normal');
                        doc.text("NAACL 2019 Schedule", (doc.internal.pageSize.width - (data.settings.margin.left*2))/2 - 30, 50);
                    }

                    /* FOOTER on each page */
                    doc.setFont('courier');
                    doc.setFontSize(8);
                    doc.text('(Generated via https://naacl2019.org/schedule)', data.settings.margin.left, doc.internal.pageSize.height - 10);
                },
                drawCell: function(cell, data) {
                    var cellClass = cell.raw.content.className;
                    /* center the day header */
                    if (cellClass == 'info-day') {
                        cell.textPos.x = (530 - data.settings.margin.left)/2 + 120;
                    }
                    /* split long plenary session text */
                    else if (cellClass == 'info-plenary') {
                        cell.text = doc.splitTextToSize(cell.text.join(' '), 530, {fontSize: 11});
                    }
                },
                createdCell: function(cell, data) {
                    var cellClass = cell.raw.content.className;
                    var cellText = cell.text[0];
                    /* */
                    if (cellClass == 'info-day') {
                        cell.styles.fontStyle = 'bold';
                        cell.styles.fontSize = 12;
                        cell.styles.fillColor = [187, 187, 187];
                    }
                    else if (cellClass == 'info-plenary') {
                        cell.styles.fontSize = 11;
                        if (cellText == "Break" || cellText == "Lunch" || cellText == "Breakfast" || cellText == "Coffee Break" || cellText == "Mini-Break") {
                            cell.styles.fillColor = [238, 238, 238];
                        }
                    }
                    else if (cellClass == 'info-poster') {
                        cell.styles.fontSize = 9;
                    }
                    else if (cellClass == "location") {
                        if (cellText == '') {
                            var infoType = data.row.raw[2].content.className;
                            if (infoType == "info-day") {
                                cell.styles.fillColor = [187, 187, 187];
                            }
                            else if (infoType == "info-plenary") {
                                cell.styles.fillColor = [238, 238, 238];
                            }
                        }
                    }
                    else if (cellClass == "time") {
                        var infoType = data.row.raw[2].content.className;
                        var infoText = data.row.raw[2].content.textContent;
                        if (infoType == "info-day" && cellText == '') {
                            cell.styles.fillColor = [187, 187, 187];
                        }
                        if (infoType == "info-plenary" && (infoText == "Break" || infoText == "Lunch" || infoText == "Breakfast" || infoText == "Coffee Break" || infoText == "Mini-Break")) {
                            cell.styles.fillColor = [238, 238, 238];
                        }
                    }
                },
            });
            doc.output('save');
        }

        function getTutorialInfoFromTime(tutorialTimeObj) {

            /* get the tutorial session and day */
            var tutorialSession = tutorialTimeObj.parents('.session');
            var sessionDay = tutorialSession.prevAll('.day:first').text().trim();

            /* get the tutorial slot and the starting and ending times */
            var tutorialTimeText = tutorialTimeObj.text().trim();
            var tutorialTimes = tutorialTimeText.split(' ');
            var tutorialSlotStart = tutorialTimes[0];
            var tutorialSlotEnd = tutorialTimes[2];
            var exactTutorialStartingTime = sessionDay + ' ' + tutorialSlotStart;
            return [new Date(exactTutorialStartingTime).getTime(), tutorialSlotStart, tutorialSlotEnd, tutorialSession.attr('id')];
        }

        function getWorkshopInfoFromTime(workshopTimeObj) {

            /* get the workshop session and day */
            var workshopSession = workshopTimeObj.parents('.session');
            var sessionDay = workshopSession.prevAll('.day:first').text().trim();

            /* get the workshop slot and the starting and ending times */
            var workshopTimeText = workshopTimeObj.text().trim();
            var workshopTimes = workshopTimeText.split(' ');
            var workshopSlotStart = workshopTimes[0];
            var workshopSlotEnd = workshopTimes[2];
            var exactworkshopStartingTime = sessionDay + ' ' + workshopSlotStart;
            return [new Date(exactworkshopStartingTime).getTime(), workshopSlotStart, workshopSlotEnd, workshopSession.attr('id')];
        }

        function getPosterInfoFromTime(posterTimeObj) {

            /* get the poster session and day */
            var posterSession = posterTimeObj.parents('.session');
            var sessionDay = posterSession.parent().prevAll('.day:first').text().trim();

            /* get the poster slot and the starting and ending times */
            var posterTimeText = posterTimeObj.text().trim();
            var posterTimes = posterTimeText.split(' ');
            var posterSlotStart = posterTimes[0];
            var posterSlotEnd = posterTimes[2];
            var exactPosterStartingTime = sessionDay + ' ' + posterSlotStart;
            return [new Date(exactPosterStartingTime).getTime(), posterSlotStart, posterSlotEnd, posterSession.attr('id')];
        }

        function isOverlapping(thisPaperRange, otherPaperRange) {
            var thisStart = thisPaperRange[0];
            var thisEnd = thisPaperRange[1];
            var otherStart = otherPaperRange[0];
            var otherEnd = otherPaperRange[1];
            return ((thisStart < otherEnd) && (thisEnd > otherStart));
        }

        function getConflicts(paperObject) {

            /* first get the parallel sessions */
            var sessionId = paperObject.parents('.session').attr('id').match(/session-\d/)[0];
            var parallelSessions = paperObject.parents('.session').siblings().filter(function() { return this.id.match(sessionId); });
            
            var thisPaperRange = paperInfoHash[paperObject.attr('paper-id')].slice(0, 2);
            return $(parallelSessions).find('table.paper-table tr#paper').filter(function(index) {
                    var otherPaperRange =  paperInfoHash[$(this).attr('paper-id')].slice(0, 2);
                    return isOverlapping(thisPaperRange, otherPaperRange) 
                });
        }

        function doWhichKey(e) {
            e = e || window.event;
            var charCode = e.keyCode || e.which;
            //Line below not needed, but you can read the key with it
            //var charStr = String.fromCharCode(charCode);
            return charCode;
        }

        function getConflicts2(paperObject) {

            /* most of the time, conflicts are simply based on papers having the same exact time slot but this is not always true */

            /* first get the conflicting sessions */
            var sessionId = paperObject.parents('.session').attr('id').match(/session-\d/)[0];
            var parallelSessions = paperObject.parents('.session').siblings().filter(function() { return this.id.match(sessionId); });
            
            /* now get the conflicting papers from those sessions */
            var paperTime = paperObject.children('td#paper-time')[0].textContent;
            return $(parallelSessions).find('table.paper-table tr#paper').filter(function(index) { return this.children[0].textContent == paperTime });

        }

        function makeDayHeaderRow(day) {
            return '<tr><td class="time"></td><td class="location"></td><td class="info-day">' + day + '</td></tr>';
        }

        function makePlenarySessionHeaderRow(session) {
            var sessionStart = session.start;
            var sessionEnd = session.end;
            return '<tr><td class="time">' + sessionStart + '&ndash;' + sessionEnd + '</td><td class="location">' + session.location + '</td><td class="info-plenary">' + session.title + '</td></tr>';
        }

        function makePaperRows(start, end, titles, sessions) {
            var ans;
            if (titles.length == 1) {
                ans = ['<tr><td class="time">' + start + '&ndash;' + end + '</td><td class="location">' + sessions[0].location + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
            }
            else {
                var numConflicts = titles.length;
                rows = ['<tr><td rowspan=' + numConflicts + ' class="time">' + start + '&ndash;' + end + '</td><td class="location">' + sessions[0].location + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
                for (var i=1; i<numConflicts; i++) {
                    var session = sessions[i];
                    var title = titles[i];
                    rows.push('<tr><td></td><td class="location">' + session.location + '</td><td class="info-paper">' + title + ' [' + session.title + ']</td></tr>')
                }
                ans = rows;
            }
            return ans;
        }

        function makeTutorialRows(start, end, titles, locations, sessions) {
            var ans;
            if (titles.length == 1) {
                ans = ['<tr><td class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
            }
            else {
                var numConflicts = titles.length;
                rows = ['<tr><td rowspan=' + numConflicts + ' class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
                for (var i=1; i<numConflicts; i++) {
                    var session = sessions[i];
                    var title = titles[i];
                    var location = locations[i];
                    rows.push('<tr><td></td><td class="location">' + location + '</td><td class="info-paper">' + title + ' [' + session.title + ']</td></tr>')
                }
                ans = rows;
            }
            return ans;
        }

    function makeWorkshopRows(start, end, titles, locations, sessions) {
            var ans;
            if (titles.length == 1) {
                ans = ['<tr><td class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
            }
            else {
                var numConflicts = titles.length;
                rows = ['<tr><td rowspan=' + numConflicts + ' class="time">' + start + '&ndash;' + end + '</td><td class="location">' + locations[0] + '</td><td class="info-paper">' + titles[0] + ' [' + sessions[0].title + ']</td></tr>'];
                for (var i=1; i<numConflicts; i++) {
                    var session = sessions[i];
                    var title = titles[i];
                    var location = locations[i];
                    rows.push('<tr><td></td><td class="location">' + location + '</td><td class="info-paper">' + title + ' [' + session.title + ']</td></tr>')
                }
                ans = rows;
            }
            return ans;
        }

        function makePosterRows(titles, types, sessions) {
            var numPosters = titles.length;
            var sessionStart = sessions[0].start;
            var sessionEnd = sessions[0].end;
            rows = ['<tr><td rowspan=' + (numPosters + 1) + ' class="time">' + sessionStart + '&ndash;' + sessionEnd + '</td><td rowspan=' + (numPosters + 1) + ' class="location">' + sessions[0].location + '</td><td class="info-paper">' + sessions[0].title +  '</td></tr>'];
            for (var i=0; i<numPosters; i++) {
                var title = titles[i];
                var type = types[i];
                /* rows.push('<tr><td></td><td></td><td class="info-poster">' + title + ' [' + type + ']</td></tr>'); */
                rows.push('<tr><td></td><td></td><td class="info-poster">' + title + '</td></tr>');
            }
            return rows;
        }

        function clearHiddenProgramTable() {
            $('#hidden-program-table tbody').html('');
        }

        function getChosenHashFromType(type) {
            var chosenHash;
            if (type == 'paper') {
                chosenHash = chosenPapersHash;
            }
            else if (type == 'tutorial') {
                chosenHash = chosenTutorialsHash;
            }
            else if (type == 'workshop') {
                chosenHash = chosenWorkshopsHash;
            }
            else if (type == 'poster') {
                chosenHash = chosenPostersHash;
            }
            return chosenHash;
        }

        function addToChosen(timeKey, item, type) {
            var chosenHash = getChosenHashFromType(type);
            if (timeKey in chosenHash) {
                var items = chosenHash[timeKey];
                items.push(item);
                chosenHash[timeKey] = items;
            }
            else {
                chosenHash[timeKey] = [item];
            }
        }

        function removeFromChosen(timeKey, item, type) {
            var chosenHash = getChosenHashFromType(type);            
            if (timeKey in chosenHash) {
                var items = chosenHash[timeKey];
                var itemIndex = items.map(function(item) { return item.title; }).indexOf(item.title);
                if (itemIndex !== -1) {
                    var removedItem = items.splice(itemIndex, 1);
                    delete removedItem;
                    if (items.length == 0) {
                        delete chosenHash[timeKey];
                    }
                    else {
                        chosenHash[timeKey] = items;
                    }
                }
            }
        }

        function isChosen(timeKey, item, type) {
            var ans = false;
            var chosenHash = getChosenHashFromType(type);
            if (timeKey in chosenHash) {
                var items = chosenHash[timeKey];
                var itemIndex = items.map(function(item) { return item.title; }).indexOf(item.title);
                ans = itemIndex !== -1;
            }
            return ans;
        }

        function toggleSession(sessionObj) {
            $(sessionObj).children('[class$="-details"]').slideToggle(300);
            $(sessionObj).children('#expander').toggleClass('expanded');
        }

        function openSession(sessionObj) {
            $(sessionObj).children('[class$="-details"]').slideDown(300);
            $(sessionObj).children('#expander').addClass('expanded');
        }

        function closeSession(sessionObj) {
            $(sessionObj).children('[class$="-details"]').slideUp(300);
            $(sessionObj).children('#expander').removeClass('expanded');
        }

        function populateHiddenProgramTable() {

            /* since papers and posters might start at the same time we cannot just rely on starting times to differentiate papers vs. posters. so, what we can do is just add an item type after we do the concatenation and then rely on that item type to distinguish the item */
            
            var nonPlenaryKeysAndTypes = [];
            var tutorialKeys = Object.keys(chosenTutorialsHash);
            var workshopKeys = Object.keys(chosenWorkshopsHash);
            var posterKeys = Object.keys(chosenPostersHash);
            var paperKeys = Object.keys(chosenPapersHash);
            for (var i=0; i < tutorialKeys.length; i++) {
                nonPlenaryKeysAndTypes.push([tutorialKeys[i], 'tutorial']);
            }
            for (var i=0; i < workshopKeys.length; i++) {
                nonPlenaryKeysAndTypes.push([workshopKeys[i], 'workshop']);
            }
            for (var i=0; i < posterKeys.length; i++) {
                nonPlenaryKeysAndTypes.push([posterKeys[i], 'poster']);
            }
            for (var i=0; i < paperKeys.length; i++) {
                nonPlenaryKeysAndTypes.push([paperKeys[i], 'paper']);
            }

            var plenaryKeys = Object.keys(plenarySessionHash);
            var plenaryKeysAndTypes = [];
            for (var i=0; i < plenaryKeys.length; i++) {
                plenaryKeysAndTypes.push([plenaryKeys[i], 'plenary']);
            }

            /* if we are including plenary information in the PDF then sort its keys too and merge the two sets of keys together before sorting */
            var sortedPaperTimes = includePlenaryInSchedule ? nonPlenaryKeysAndTypes.concat(plenaryKeysAndTypes) : nonPlenaryKeysAndTypes;
            sortedPaperTimes.sort(function(a, b) { return a[0] - b[0] });

            /* now iterate over these sorted papers and create the rows for the hidden table that will be used to generate the PDF */
            var prevDay = null;
            var latestEndingTime;
            var output = [];

            /* now iterate over the chosen items */
            for(var i=0; i<sortedPaperTimes.length; i++) {
                var keyAndType = sortedPaperTimes[i];
                var key = keyAndType[0];
                var itemType = keyAndType[1]
                /* if it's a plenary session */
                if (itemType == 'plenary') {
                    var plenarySession = plenarySessionHash[key];
                    if (plenarySession.day == prevDay) {
                        output.push(makePlenarySessionHeaderRow(plenarySession));
                    }
                    else {
                        output.push(makeDayHeaderRow(plenarySession.day));
                        output.push(makePlenarySessionHeaderRow(plenarySession));
                    }
                    prevDay = plenarySession.day;
                }
                /* if it's tutorials */
                else if (itemType == 'tutorial') {

                    /* get the tutorials */
                    var tutorials = chosenTutorialsHash[key];

                    /* sort the tutorials by title instead of selection order */
                    tutorials.sort(function(a, b) {
                        return a.title.localeCompare(b.title);
                    });

                    var titles = tutorials.map(function(tutorial) { return ASCIIFold(tutorial.title); });
                    var locations = tutorials.map(function(tutorial) { return tutorial.location ; });
                    var sessions = tutorials.map(function(tutorial) { return sessionInfoHash[tutorial.session]; });
                    var sessionDay = sessions[0].day;
                    if (sessionDay != prevDay) {
                        output.push(makeDayHeaderRow(sessionDay));
                    }
                    output = output.concat(makeTutorialRows(tutorials[0].start, tutorials[0].end, titles, locations, sessions));
                    prevDay = sessionDay;
                }
                /* if it's workshops */
                else if (itemType == 'workshop') {

                    /* get the workshops */
                    var workshops = chosenWorkshopsHash[key];

                    /* sort the workshops by title instead of selection order */
                    workshops.sort(function(a, b) {
                        return a.title.localeCompare(b.title);
                    });

                    var titles = workshops.map(function(workshop) { return ASCIIFold(workshop.title); });
                    var locations = workshops.map(function(workshop) { return workshop.location ; });
                    var sessions = workshops.map(function(workshop) { return sessionInfoHash[workshop.session]; });
                    var sessionDay = sessions[0].day;
                    if (sessionDay != prevDay) {
                        output.push(makeDayHeaderRow(sessionDay));
                    }
                    output = output.concat(makeWorkshopRows(workshops[0].start, workshops[0].end, titles, locations, sessions));
                    prevDay = sessionDay;
                }
                /* if it's posters */
                else if (itemType == 'poster') {

                    /* get the posters */
                    var posters = chosenPostersHash[key];

                    /* sort posters by their type for easier reading */
                    posters.sort(function(a, b) {
                        return a.type.localeCompare(b.type);
                    });
                    var titles = posters.map(function(poster) { return ASCIIFold(poster.title); });
                    var types = posters.map(function(poster) { return poster.type; });
                    var sessions = [sessionInfoHash[posters[0].session]];
                    var sessionDay = sessions[0].day;
                    if (sessionDay != prevDay) {
                        output.push(makeDayHeaderRow(sessionDay));
                    }
                    output = output.concat(makePosterRows(titles, types, sessions));
                    prevDay = sessionDay;
                }

                /* if it's papers  */
                else if (itemType == 'paper') {
                    var papers = chosenPapersHash[key];
                    /* sort papers by location for easier reading */
                    papers.sort(function(a, b) {
                        var aLocation = sessionInfoHash[a.session].location;
                        var bLocation = sessionInfoHash[b.session].location;
                        return aLocation.localeCompare(bLocation);
                    });
                    var titles = papers.map(function(paper) { return ASCIIFold(paper.title); });
                    var sessions = papers.map(function(paper) { return sessionInfoHash[paper.session]; });
                    var sessionDay = sessions[0].day;
                    if (sessionDay != prevDay) {
                        output.push(makeDayHeaderRow(sessionDay));
                    }
                    output = output.concat(makePaperRows(papers[0].start, papers[0].end, titles, sessions));
                    prevDay = sessionDay;
                }
            }

            /* append the output to the hidden table */
            $('#hidden-program-table tbody').append(output);
        }

        $(document).ready(function() {
            
            /* all the Remove All buttons are disabled on startup */
            $('.session-deselector').addClass('disabled');

            /* the include plenary checkbox is checked on startup */
            $('input#includePlenaryCheckBox').prop('checked', true);

            /* show the help window whenever "?" is pressed */
            $(document).keypress(function(event) {
                if (doWhichKey(event) == 63 && !helpShown) {
                    helpShown = true;
                    alertify.alert(instructions, function(event) { helpShown = false;});
                }
            });

            /* show the help window when the help button is clicked */
            $('a#help-button').on('click', function (event) {
                if (!helpShown) {
                    event.preventDefault();
                    helpShown = true;
                    alertify.alert(instructions, function(event) { helpShown = false;});
                }
            });

            /* expand/collapse all sessions when the toggle button is clicked */
            $('a#toggle-all-button').on('click', function (event) {
                event.preventDefault();
                var buttonText = $(this).text();

                / * expand all collapsed sessions */
                if (buttonText == 'Expand All Sessions ↓') {
                    $('div#expander').not('.expanded').trigger('click');
                    $(this).text('Collapse All Sessions ↑');
                }
                /* collapse all expanded sessions */
                else {
                    $('div#expander.expanded').trigger('click');
                    $(this).text('Expand All Sessions ↓');
                }
            });


            $('span.session-location, span.inline-location').on('click', function(event) {
                event.stopPropagation();
            });

            $('span.session-external-location').on('click', function(event) {
                var placeName = $(this).text().trim().replace(" ", "+");
                window.open("https://www.google.com/maps?q=" + placeName, "_blank");
                event.stopPropagation();
            });

            /* show the floorplan when any location is clicked */
            $('span.session-location, span.inline-location').magnificPopup({
                items: {
                    src: '/assets/images/minneapolis/3d-floormap.png'
                },
                type: 'image',
                fixedContentPos: 'auto'
            });

            /* get all the tutorial sessions and save the day and location for each of them in a hash */
            $('.session-tutorials').each(function() {
                var session = {};
                session.title = $(this).children('.session-title').text().trim();
                session.day = $(this).prevAll('.day:first').text().trim();
                sessionInfoHash[$(this).attr('id')] = session;
            });

            /* get all the workshop sessions and save the day and location for each of them in a hash */
            $('.session-workshops').each(function() {
                var session = {};
                session.title = $(this).children('.session-title').text().trim();
                session.day = $(this).prevAll('.day:first').text().trim();
                sessionInfoHash[$(this).attr('id')] = session;
            });

            /* get all the poster sessions and save the day and location for each of them in a hash */
            $('.session-posters').each(function() {
                var session = {};
                session.title = $(this).children('.session-title').text().trim();
                session.day = $(this).parent().prevAll('.day:first').text().trim();
                session.location = $(this).children('span.session-location').text().trim();
                var sessionTimeText = $(this).children('span.session-time').text().trim();                
                var sessionTimes = sessionTimeText.match(/\d+:\d+/g);
                var sessionStart = sessionTimes[0];
                var sessionEnd = sessionTimes[1];
                session.start = sessionStart;
                session.end = sessionEnd;
                sessionInfoHash[$(this).attr('id')] = session;
            });

            /* get all the paper sessions and save the day and location for each of them in a hash */
            var paperSessions = $("[id|='session']").filter(function() { 
                return this.id.match(/session-\d\d?[a-z]$/);
            });
            $(paperSessions).each(function() {
                var session = {};
                session.title = $(this).children('.session-title').text().trim();
                session.location = $(this).children('span.session-location').text().trim();
                session.day = $(this).parent().prevAll('.day:first').text().trim();
                var sessionTimeText = $(this).children('span.session-time').text().trim();                
                var sessionTimes = sessionTimeText.match(/\d+:\d+/g);
                var sessionStart = sessionTimes[0];
                var sessionEnd = sessionTimes[1];
                session.start = sessionStart;
                session.end = sessionEnd;
                sessionInfoHash[$(this).attr('id')] = session;
            });

            /* iterate over all the papers and store all their info in a hash since we need that info whenever we click and hover and lookups will be faster than re-computing the info at each event */
            $('tr#paper').each(function() {
                var paperID = $(this).attr('paper-id');

                /* get the paper session and day */
                var paperSession = $(this).parents('.session');
                var sessionDay = paperSession.parent().prevAll('.day:first').text().trim();

                /* get the paper time and title */
                var paperTimeObj = $(this).children('#paper-time');
                var paperTitle = paperTimeObj.siblings('td').text().trim().replace(/\s\s+/g, " ");

                /* get the paper slot and the starting and ending times */
                var paperTimeText = paperTimeObj.text().trim();
                var paperTimes = paperTimeText.split('\u2013');
                var paperSlotStart = paperTimes[0];
                var paperSlotEnd = paperTimes[1];
                var exactPaperStartingTime = sessionDay + ' ' + paperSlotStart;
                var exactPaperEndingTime = sessionDay + ' ' + paperSlotEnd;

                paperInfoHash[paperID] = [new Date(exactPaperStartingTime).getTime(), new Date(exactPaperEndingTime).getTime(), paperSlotStart, paperSlotEnd, paperTitle, paperSession.attr('id')];
            });

            /* also save the plenary session info in another hash since we may need to add this to the pdf. Use the exact starting time as the hash key */
             $('.session-plenary').each(function() {
                var session = {};
                session.title = $(this).children('.session-title').text().trim();
                if (session.title == "Social Event") {
                    session.location = $(this).children('span.session-external-location').text().trim();
                }
                else {
                    session.location = $(this).children('span.session-location').text().trim();                    
                }
                session.day = $(this).prevAll('.day:first').text().trim();
                session.id = $(this).attr('id');
                var sessionTimeText = $(this).children('span.session-time').text().trim();
                var sessionTimes = sessionTimeText.match(/\d+:\d+/g);
                var sessionStart = sessionTimes[0];
                var sessionEnd = sessionTimes[1];
                session.start = sessionStart;
                session.end = sessionEnd;
                var exactSessionStartingTime = session.day + ' ' + sessionStart;
                plenarySessionHash[new Date(exactSessionStartingTime).getTime()] = session;
             });

            $('body').on('click', 'a.session-selector', function(event) {

                /* if we are disabled, do nothing */
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                /* if we are choosing the entire session, then basically "click" on all of the not-selected papers */
                var sessionPapers = $(this).siblings('table.paper-table').find('tr#paper');
                var unselectedPapers = sessionPapers.not('.selected');
                unselectedPapers.trigger('click', true);

                /* now find out how many papers are selected after the trigger */
                var selectedPapers = sessionPapers.filter('.selected');

                /* disable myself (the choose all button) */
                $(this).addClass('disabled');

                /* if we didn't have any papers selected earlier, then enable the remove all button */
                if (unselectedPapers.length == sessionPapers.length) {
                    $(this).siblings('.session-deselector').removeClass('disabled');
                }

                /* this is not really a link */
                event.preventDefault();
                return false;
            });

            $('body').on('click', 'a.session-deselector', function(event) {

                /* if we are disabled, do nothing */
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                /* otherwise, if we are removing the entire session, then basically "click" on all of the already selected papers */
                var sessionPapers = $(this).siblings('table.paper-table').find('tr#paper');
                var selectedPapers = sessionPapers.filter('.selected');
                selectedPapers.trigger('click', true);

                /* disable myself (the remove all button) */
                $(this).addClass('disabled');

                /* enable the choose all button */
                $(this).siblings('session-deselector').removeClass('disabled');

                /* if all the papers were selected earlier, then enable the choose all button */
                if (selectedPapers.length == sessionPapers.length) {
                    $(this).siblings('.session-selector').removeClass('disabled');                    
                }

                /* this is not really a link */
                event.preventDefault();
                return false;
            });

            /* hide all of the session details when starting up */
            $('[class$="-details"]').hide();

            /* expand sessions when their title is clicked */
            $('body').on('click', 'div.session-expandable .session-title, div#expander', function(event) {
                event.preventDefault();
                event.stopPropagation();
                var sessionObj = $(this).parent();

                /* if we had the shift key pressed, then expand ALL unexpanded parallel sessions including myself (only for papers) */
                if (event.shiftKey && sessionObj.attr('class').match('session-papers')) {
                    var sessionId = $(sessionObj).attr('id').match(/session-\d/)[0];
                    var parallelSessions = $(sessionObj).siblings().addBack().filter(function() { return this.id.match(sessionId); });

                    var unexpandedParallelSessions = $(parallelSessions).filter(function() { return !$(this).children('#expander').hasClass('expanded'); });

                    /* if all sessions are already expanded, then shift-clicking should close all of them */
                    if (unexpandedParallelSessions.length == 0) {
                        $.map(parallelSessions, closeSession);
                    }
                    else {
                        $.map(unexpandedParallelSessions, openSession);
                    }
                } 
                /* for a regular click, just toggle the individual session */
                else {
                    toggleSession(sessionObj);
                }
            });

            /* when we mouse over a paper icon, do not do anything */
            $('body').on('mouseover', 'table.paper-table tr#paper i[class$="-icon"]', function(event) {
                return false;
            });

            /* when we mouse over a paper, highlight the conflicting papers */
            $('body').on('mouseover', 'table.paper-table tr#paper', function(event) {
                var conflictingPapers = getConflicts($(this));
                $(this).addClass('hovered');
                $(conflictingPapers).addClass('conflicted');
            });

            /* when we mouse out, remove all highlights */
            $('body').on('mouseout', 'table.paper-table tr#paper', function(event) {
                var conflictingPapers = getConflicts($(this));
                $(this).removeClass('hovered');
                $(conflictingPapers).removeClass('conflicted');

            });

            $('body').on('click', 'a.info-button', function(event) {
                return false;
            });

            $('body').on('click', 'a.info-link', function(event) {
                event.stopPropagation();
            });

            $('body').on('click', 'div.session-abstract', function(event) {
                event.stopPropagation();
            });

            $('body').on('click', 'table.paper-table', function(event) {
                event.stopPropagation();
            });

            $('body').on('click', 'table.tutorial-table', function(event) {
                event.stopPropagation();
            });

            $('body').on('click', 'table.poster-table', function(event) {
                event.stopPropagation();
            });

            $('body').on('click', 'div.paper-session-details', function(event) {
                event.stopPropagation();
            });

            $('body').on('click', 'input#includePlenaryCheckBox', function(event) {
                    includePlenaryInSchedule = $(this).prop('checked');
            });

            $('body').on('click', 'a#generatePDFButton', function(event) {
                /* if we haven't chosen any papers, and we aren't including plenary sessions either, then raise an error. If we are including plenary sessions and no papers, then confirm. */
                event.preventDefault();
                var numChosenItems = Object.keys(chosenPapersHash).length + Object.keys(chosenTutorialsHash).length + Object.keys(chosenWorkshopsHash).length + Object.keys(chosenPostersHash).length;
                if (numChosenItems == 0) {
                    if (includePlenaryInSchedule) {
                        alertify.confirm("The PDF will contain only the plenary sessions since nothing was chosen. Proceed?", function () { generatePDFfromTable();
                                }, function() { return false; });
                    }
                    else {
                        alertify.alert('Nothing to generate. Nothing was chosen and plenary sessions were excluded.');
                        return false;
                    }
                }
                else {
                    generatePDFfromTable();
                }
            });

            $('body').on('click', 'table.tutorial-table tr#tutorial', function(event) {
                event.preventDefault();
                var tutorialTimeObj = $(this).parents('.session-tutorials').children('.session-time');
                var tutorialInfo = getTutorialInfoFromTime(tutorialTimeObj);
                var tutorialObject = {};
                var exactStartingTime = tutorialInfo[0];
                tutorialObject.start = tutorialInfo[1];
                tutorialObject.end = tutorialInfo[2];
                tutorialObject.title = $(this).find('.tutorial-title').text();
                tutorialObject.session = tutorialInfo[3];
                tutorialObject.location = $(this).find('.inline-location').text();
                tutorialObject.exactStartingTime = exactStartingTime;

                /* if we are clicking on an already selected tutorial */
                if (isChosen(exactStartingTime, tutorialObject, 'tutorial')) {
                    $(this).removeClass('selected');
                    removeFromChosen(exactStartingTime, tutorialObject, 'tutorial');
                }
                else {
                    addToChosen(exactStartingTime, tutorialObject, 'tutorial');
                    $(this).addClass('selected');                    
                }
            });

            $('body').on('click', 'table.workshop-table tr#workshop', function(event) {
                event.preventDefault();
                var workshopTimeObj = $(this).parents('.session-workshops').children('.session-time');
                var workshopInfo = getWorkshopInfoFromTime(workshopTimeObj);
                var workshopObject = {};
                var exactStartingTime = workshopInfo[0];
                workshopObject.start = workshopInfo[1];
                workshopObject.end = workshopInfo[2];
                workshopObject.title = $(this).find('.workshop-title').text();
                workshopObject.session = workshopInfo[3];
                workshopObject.location = $(this).find('.inline-location').text();
                workshopObject.exactStartingTime = exactStartingTime;

                /* if we are clicking on an already selected workshop */
                if (isChosen(exactStartingTime, workshopObject, 'workshop')) {
                    $(this).removeClass('selected');
                    removeFromChosen(exactStartingTime, workshopObject, 'workshop');
                }
                else {
                    addToChosen(exactStartingTime, workshopObject, 'workshop');
                    $(this).addClass('selected');                    
                }
            });

            $('body').on('click', 'table.poster-table tr#poster', function(event) {
                event.preventDefault();
                var posterTimeObj = $(this).parents('.session-posters').children('.session-time');
                var posterInfo = getPosterInfoFromTime(posterTimeObj);
                var posterObject = {};
                var exactStartingTime = posterInfo[0];
                posterObject.start = posterInfo[1];
                posterObject.end = posterInfo[2];
                posterObject.title = $(this).find('.poster-title').text().trim();
                posterObject.type = $(this).parents('.poster-table').prevAll('.poster-type:first').text().trim();
                posterObject.session = posterInfo[3];
                posterObject.exactStartingTime = exactStartingTime;

                /* if we are clicking on an already selected poster */
                if (isChosen(exactStartingTime, posterObject, 'poster')) {
                    $(this).removeClass('selected');
                    removeFromChosen(exactStartingTime, posterObject, 'poster');
                }
                else {
                    addToChosen(exactStartingTime, posterObject, 'poster');
                    $(this).addClass('selected');
                    var key = new Date(exactStartingTime).getTime();
                    if (key in plenarySessionHash) {
                        delete plenarySessionHash[key];
                    }
                }
            });

            /* open the URL in a new window/tab when we click on the any icon - whether it is the keynote slides or the video */            
            $('body').on('click', 'div.session-abstract p i[class$="-icon"]', function(event) {
                event.stopPropagation();
                event.preventDefault();
                var urlToOpen = $(this).attr('data');
                if (urlToOpen !== '') {
                    window.open(urlToOpen, "_blank");
                }
            });


            /* open the anthology or video URL in a new window/tab when we click on the PDF or video icon respectively  */            
            $('body').on('click', 'table.tutorial-table tr#tutorial i[class$="-icon"],table.paper-table tr#paper i[class$="-icon"],table.paper-table tr#best-paper i[class$="-icon"],table.poster-table tr#poster i[class$="-icon"]', function(event) {
                event.stopPropagation();
                event.preventDefault();
                var urlToOpen = $(this).attr('data');
                if (urlToOpen !== '') {
                    window.open(urlToOpen, "_blank");
                }
            });

            $('body').on('click', 'table.paper-table tr#paper', function(event, fromSession) {
                event.preventDefault();
                $(this).removeClass('hovered');
                getConflicts($(this)).removeClass('conflicted');
                var paperID = $(this).attr('paper-id');
                var paperTimeObj = $(this).children('td#paper-time');
                var paperInfo = paperInfoHash[paperID];
                var paperObject = {};
                var exactStartingTime = paperInfo[0];
                paperObject.start = paperInfo[2];
                paperObject.end = paperInfo[3];
                paperObject.title = paperInfo[4];
                paperObject.session = paperInfo[5];
                paperObject.exactStartingTime = exactStartingTime;

                /* if we are clicking on an already selected paper */
                if (isChosen(exactStartingTime, paperObject, 'paper')) {
                    $(this).removeClass('selected');
                    removeFromChosen(exactStartingTime, paperObject, 'paper');

                    /* if we are not being triggered at the session level, then we need to handle the state of the session level button ourselves */
                    if (!fromSession) {
        
                        /* we also need to enable the choose button */
                        $(this).parents('table.paper-table').siblings('.session-selector').removeClass('disabled');

                        /* we also need to disable the remove button if this was the only paper selected in the session */
                        var selectedPapers = $(this).siblings('tr#paper').filter('.selected');
                        if (selectedPapers.length == 0) {
                            $(this).parents('table.paper-table').siblings('.session-deselector').addClass('disabled');
                        }
                    }
                }
                else {
                    /* if we are selecting a previously unselected paper */
                    addToChosen(exactStartingTime, paperObject, 'paper');
                    $(this).addClass('selected');

                    /* if we are not being triggered at the session level, then we need to handle the state of the session level button ourselves */
                    if (!fromSession) {

                        /* we also need to enable the remove button */
                        $(this).parents('table.paper-table').siblings('.session-deselector').removeClass('disabled');

                        /* and disable the choose button if all the papers are now selected anyway */
                        var sessionPapers = $(this).siblings('tr#paper');
                        var selectedPapers = sessionPapers.filter('.selected');
                        if (sessionPapers.length == selectedPapers.length) {
                            $(this).parents('table.paper-table').siblings('.session-selector').addClass('disabled');
                        }
                    }
                }
            });
        });
    </script>
---
<link rel="stylesheet" href="/assets/css/alertify.css" id="alertifyCSS">

<table id="hidden-program-table">
    <thead>
        <tr><th>time</th><th>location</th><th>info</th></tr>
    </thead>
    <tbody></tbody>
</table>

<div id="introParagraph">
        <p>On this page, you can choose the sessions (and individual papers/posters) of your choice <em>and</em> generate a PDF of your customized schedule! This page should work on modern browsers on all operating systems. On mobile devices, Safari on iOS and Chrome on Android are the only browsers known to work. For the best experience, use a non-mobile device. For help, simply type "?"" while on the page or click on the "Help" button.</p>
        <p><strong>Note</strong>: To accommodate the large number of attendees, some sessions will be livestreamed into multiple rooms. For sessions listed with multiple rooms, the first room will have the actual presentations &amp; the rest will show a live-streamed feed of the presentations. Recorded videos for talks are linked below in the schedule. To request the removal of your video, contact the <a href="mailto:emnlp2018-video-chair@googlegroups.com">video chair</a>. Videos for the 3 tutorials on October 31st are unfortunately unavailable due to unforeseen issues with the videography.</p>
</div>

<p class="text-center">
    <a href="#" id="help-button" class="btn btn--small btn--twitter">Help</a>
</p>
<p class="text-center">
    <a href="#" id="toggle-all-button" class="btn btn--small btn--twitter">Expand All Sessions ↓</a>
</p>

<div class="schedule">
    <div class="day" id="first-day">Wednesday, October 31 2018</div>
    <div class="session session-expandable session-tutorials" id="session-morning-tutorials1">
        <div id="expander"></div><a href="#" class="session-title">Morning Tutorials</a><br/>
        <span class="session-time" title="Wednesday, October 31 2018">09:00 &ndash; 12:30</span><br/>
        <div class="tutorial-session-details">
            <br/>
            <table class="tutorial-table">
                <tr id="tutorial">
                    <td>
                        <span class="tutorial-title"><strong>[T1] Joint Models for NLP.</strong> Yue Zhang. </span> <br/><span class="btn btn--location inline-location">Gold Hall</span>
                    </td>
                </tr>
                <tr id="tutorial">
                    <td>
                        <span class="tutorial-title"><strong>[T2] Graph Formalisms for Meaning Representations.</strong> Adam Lopez and Sorcha Gilroy.</span><br/><span href="#" class="btn btn--location inline-location">Hall 100</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="session session-break session-plenary" id="session-lunch-1">
        <span class="session-title">Lunch</span><br/>        
        <span class="session-time" title="Wednesday, October 31 2018">12:30 &ndash; 14:00</span>
    </div>    
    <div class="session session-expandable session-tutorials" id="session-afternoon-tutorials1">
        <div id="expander"></div><a href="#" class="session-title">Afternoon Tutorials</a><br/>
        <span class="session-time" title="Wednesday, October 31 2018">14:00 &ndash; 17:30</span><br/>
        <div class="tutorial-session-details">
            <br/>
            <table class="tutorial-table">
                <tr id="tutorial">
                    <td>
                        <span class="tutorial-title"><strong>[T3] Writing Code for NLP Research.</strong> Matt Gardner, Mark Neumann, Joel Grus, and Nicholas Lourie. </span><br/><span href="#" class="btn btn--location inline-location">Gold Hall</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="session session-expandable session-workshops" id="session-workshops-1">
        <div id="expander"></div><a href="#" class="session-title">Workshops &amp; Co-located Events</a><br/>
        <span class="session-time" title="Wednesday, October 31 2018">08:30 &ndash; 18:00</span><br/>
        <div class="workshop-session-details">
            <br/>
            <table class="workshop-table">
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W1] WMT18: The Third Conference on Machine Translation (Day 1).</strong> </span> <br/><span class="btn btn--location inline-location">Bozar Hall (Salle M)</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W2] CoNLL: The Conference on Computational Natural Language Learning (Day 1).</strong> </span> <br/><span class="btn btn--location inline-location">Copper Hall / Studio 311 &ndash; 312</span>
                    </td>
                </tr>                
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W3] LOUHI: The Ninth International Workshop on Health Text Mining and Information Analysis.</strong> </span> <br/><span class="btn btn--location inline-location">The Arc</span>
                    </td>
                </tr> 
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W4] ALW2: Second Workshop on Abusive Language Online.</strong> </span> <br/><span class="btn btn--location inline-location">Studio 211 &ndash; 212</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W5] SCAI: Search-Oriented Conversational AI.</strong> </span> <br/><span class="btn btn--location inline-location">Silver Hall / Studio 313 &ndash; 315</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W6] SIGMORPHON: Fifteenth Workshop on Computational Research in Phonetics, Phonology, and Morphology.</strong> </span> <br/><span class="btn btn--location inline-location">Studio 213 &ndash; 215</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W7] WASSA: 9th Workshop on Computational Approaches to Subjectivity, Sentiment and Social Media Analysis.</strong> </span> <br/><span class="btn btn--location inline-location">Hall 400</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W8] SMM4H: 3rd Workshop on Social Media Mining for Health Applications Workshop & Shared Task.</strong> </span> <br/><span class="btn btn--location inline-location">Studio 201A/B</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="day" id="second-day">Thursday, November 1 2018</div>
    <div class="session session-expandable session-tutorials" id="session-morning-tutorials2">
        <div id="expander"></div><a href="#" class="session-title">Morning Tutorials</a><br/>
        <span class="session-time" title="Thursday, November 1 2018">09:00 &ndash; 12:30</span><br/>
        <div class="tutorial-session-details">
            <br/>
            <table class="tutorial-table">
                <tr id="tutorial">
                    <td>
                        <span class="tutorial-title"><strong>[T4] Deep Latent Variable Models of Natural Language.</strong> Alexander Rush, Yoon Kim, and Sam Wiseman. &nbsp;<i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305182667" aria-hidden="true" title="Video"></i></span> <br/><span class="btn btn--location inline-location">Gold Hall</span>
                    </td>
                </tr>
                <tr id="tutorial">
                    <td>
                        <span class="tutorial-title"><strong>[T5] Standardized Tests as benchmarks for Artificial Intelligence.</strong> Mrinmaya Sachan, Minjoon Seo, Hannaneh Hajishirzi, and Eric Xing. &nbsp;<i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305187739" aria-hidden="true" title="Video"></i></span><br/><span href="#" class="btn btn--location inline-location">Hall 400</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="session session-break session-plenary" id="session-lunch-2">
        <span class="session-title">Lunch</span><br/>        
        <span class="session-time" title="Thursday, November 1 2018">12:30 &ndash; 14:00</span>
    </div>    
    <div class="session session-expandable session-tutorials" id="session-afternoon-tutorials2">
        <div id="expander"></div><a href="#" class="session-title">Afternoon Tutorials</a><br/>
        <span class="session-time" title="Thursday, November 1 2018">14:00 &ndash; 17:30</span><br/>
        <div class="tutorial-session-details">
            <br/>
            <table class="tutorial-table">
                <tr id="tutorial">
                    <td>
                        <span class="tutorial-title"><strong>[T6] Deep Chit-Chat: Deep Learning for ChatBots.</strong> Wei Wu and Rui Yan. &nbsp;<i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305179403" aria-hidden="true" title="Video"></i></span><br/><span href="#" class="btn btn--location inline-location">Gold Hall</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="session session-expandable session-workshops" id="session-workshops-2">
        <div id="expander"></div><a href="#" class="session-title">Workshops &amp; Co-located Events</a><br/>
        <span class="session-time" title="Thursday, November 1 2018">09:00 &ndash; 17:00</span><br/>
        <div class="workshop-session-details">
            <br/>
            <table class="workshop-table">
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W1] WMT18: The Third Conference on Machine Translation (Day 2).</strong> </span> <br/><span class="btn btn--location inline-location">Bozar Hall (Salle M)</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W2] CoNLL: The Conference on Computational Natural Language Learning (Day 2).</strong> </span> <br/><span class="btn btn--location inline-location">Copper Hall / Studio 311 &ndash; 312</span>
                    </td>
                </tr>                
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W9] BioASQ: Large-scale Biomedical Semantic Indexing and Question Answering.</strong> </span> <br/><span class="btn btn--location inline-location">Studio 313 &ndash; 315</span>
                    </td>
                </tr> 
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W10] BlackboxNLP: Analyzing and Interpreting Neural Networks for NLP.</strong> </span> <br/><span class="btn btn--location inline-location">Silver Hall / Hall 100</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W11] FEVER: First Workshop on Fact Extraction and VERification.</strong> </span> <br/><span class="btn btn--location inline-location">The Arc</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W12] ARGMINING: 5th International Workshop on Argument Mining.</strong> </span> <br/><span class="btn btn--location inline-location">Studio 213 &ndash; 215</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W13] W-NUT: 4th Workshop on Noisy User-generated Text.</strong> </span> <br/><span class="btn btn--location inline-location">Panoramic Hall</span>
                    </td>
                </tr>
                <tr id="workshop">
                    <td>
                        <span class="workshop-title"><strong>[W14] UDW-18: Second Workshop on Universal Dependencies.</strong> </span> <br/><span class="btn btn--location inline-location">Studio 201A/B</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    <div class="session session-expandable session-plenary" id="session-reception">
        <div id="expander"></div>
        <a href="#" class="session-title">Welcome Reception</a>
        <br/>
        <span class="session-time" title="Thursday, November 1 2018">18:00 &ndash; 20:00</span>
        <br/>
        <span class="session-location btn btn--location">Grand Hall</span>
        <div class="paper-session-details">
            <br/><br/>
            <div class="session-abstract">
                <p>Catch up with your colleagues at the Welcome Reception! It will be held immediately following the tutorials on Thursday, November 1st. <br/>Appetizers and refreshments will be provided.</p>
            </div>
        </div>
    </div>
    <div class="day" id="day-3">Friday, 2 November 2018</div>
    <div class="session session-plenary" id="session-welcome">
        <span class="session-title">Opening remarks</span>
        <br/>
        <span class="session-time" title="Friday, 2 November 2018">09:00 &ndash; 09:30</span>
        <br/>
        <span class="session-location btn btn--location">Gold Hall / Copper Hall / Silver Hall / Hall 100</span>
    </div>
    <div class="session session-expandable session-plenary">
        <div id="expander"></div>
        <a href="#" class="session-title">
            <strong>Keynote I: "Truth or Lie? Spoken Indicators of Deception in Speech"</strong>
        </a>
        <br/>
        <span class="session-people">
            <a href="http://www.cs.columbia.edu/~julia/" target="_blank">Julia Hirschberg (Columbia University)</a>
        </span>
        <br/>
        <span class="session-time" title="Friday, 2 November 2018">09:30 &ndash; 10:30</span>
        <br/>
        <span class="session-location btn btn--location">Gold Hall / Copper Hall / Silver Hall / Hall 100</span>
        <div class="paper-session-details">
            <br/>
            <div class="session-abstract">
                <p>Detecting deception from various forms of human behavior is a longstanding research goal which is of considerable interest to the military, law enforcement, corporate security, social services and mental health workers. However, both humans and polygraphs are very poor at this task. We describe more accurate methods we have developed to detect deception automatically from spoken language. Our classifiers are trained on the largest cleanly recorded corpus of within-subject deceptive and non-deceptive speech that has been collected. To distinguish truth from lie we make use of acoustic-prosodic, lexical, demographic, and personality features. We further examine differences in deceptive behavior based upon gender, personality, and native language (Mandarin Chinese vs. English), comparing our systems to human performance. We extend our studies to identify cues in trusted speech vs. mistrusted speech and how these features differ by speaker and by listener. Why does a listener believe a lie?&nbsp;
                    <i class="fa fa-television slides-icon" data="/downloads/keynote-slides/JuliaHirschberg.pdf" aria-hidden="true" title="Slides"></i>&nbsp;
                    <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305200179" aria-hidden="true" title="Video"></i>
                </p>
            </div>
        </div>
    </div>
    <div class="session session-break session-plenary" id="session-break-1">
        <span class="session-title">Coffee Break</span>
        <br/>
        <span class="session-time" title="Friday, 2 November 2018">10:30 &ndash; 11:00</span>
    </div>
    <div class="session-box" id="session-box-1">
        <div class="session-header" id="session-header-1">Long Papers &amp; Demos I (Orals &amp; Posters)</div>
        <div class="session session-expandable session-papers1" id="session-1a">
            <div id="expander"></div>
            <a href="#" class="session-title">1A: Social Applications I</a>
            <br/>
            <span class="session-time" title="Friday, 2 November 2018">11:00 &ndash; 12:30</span>
            <br/>
            <span class="session-location btn btn--location">Gold Hall</span>
            <br/>
            <div class="paper-session-details">
                <br/>
                <a href="#" class="session-selector" id="session-1a-selector">Choose All</a>
                <a href="#" class="session-deselector" id="session-1a-deselector">Remove All</a>
                <table class="paper-table">
                    <tr>
                        <td class="session-chair" colspan="2">Chair:
                            <a href="mailto:mail@dirkhovy.com">Dirk Hovy</a>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="523">
                        <td id="paper-time">11:00&ndash;11:18</td>
                        <td>
                            <span class="paper-title">Privacy-preserving Neural Representations of Text.</span>
                            <em>Maximin Coavoux, Shashi Narayan and Shay B. Cohen</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1001" aria-hidden="true" title="PDF"></i>&nbsp;
                        </td>
                    </tr>
                    <tr id="paper" paper-id="888">
                        <td id="paper-time">11:18&ndash;11:36</td>
                        <td>
                            <span class="paper-title">Adversarial Removal of Demographic Attributes from Text Data.</span>
                            <em>Yanai Elazar and Yoav Goldberg</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1002" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305203150" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="909">
                        <td id="paper-time">11:36&ndash;11:54</td>
                        <td>
                            <span class="paper-title">DeClarE: Debunking Fake News and False Claims using Evidence-Aware Deep Learning.</span>
                            <em>Kashyap Popat, Subhabrata Mukherjee, Andrew Yates and Gerhard Weikum</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1003" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305203523" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1879">
                        <td id="paper-time">11:54&ndash;12:12</td>
                        <td>
                            <span class="paper-title">It's going to be okay: Measuring Access to Support in Online Communities.</span>
                            <em>Zijian Wang and David Jurgens</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1004" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305203914" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1903">
                        <td id="paper-time">12:12&ndash;12:30</td>
                        <td>
                            <span class="paper-title">Detecting Gang-Involved Escalation on Social Media Using Context.</span>
                            <em>Serina Chang, Ruiqi Zhong, Ethan Adams, Fei-Tzin Lee, Siddharth Varia, Desmond Patton, William Frey, Chris Kedzie and Kathy McKeown</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1005" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305204297" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="session session-expandable session-papers2" id="session-1b">
            <div id="expander"></div>
            <a href="#" class="session-title">1B: Semantics I</a>
            <br/>
            <span class="session-time" title="Friday, 2 November 2018">11:00 &ndash; 12:30</span>
            <br/>
            <span class="session-location btn btn--location">Copper Hall</span>
            <br/>
            <div class="paper-session-details">
                <br/>
                <a href="#" class="session-selector" id="session-1b-selector">Choose All</a>
                <a href="#" class="session-deselector" id="session-1b-deselector">Remove All</a>
                <table class="paper-table">
                    <tr>
                        <td class="session-chair" colspan="2">Chair:
                            <a href="mailto:natschluter@itu.dk">Natalie Schluter</a>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1172">
                        <td id="paper-time">11:00&ndash;11:18</td>
                        <td>
                            <span class="paper-title">Reasoning about Actions and State Changes by Injecting Commonsense Knowledge.</span>
                            <em>Niket Tandon, Bhavana Dalvi, Joel Grus, Wen-tau Yih, Antoine Bosselut and Peter Clark</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1006" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305193585" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1494">
                        <td id="paper-time">11:18&ndash;11:36</td>
                        <td>
                            <span class="paper-title">Collecting Diverse Natural Language Inference Problems for Sentence Representation Evaluation.</span>
                            <em>Adam Poliak, Aparajita Haldar, Rachel Rudinger, J. Edward Hu, Ellie Pavlick, Aaron Steven White and Benjamin Van Durme</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1007" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305194062" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1634">
                        <td id="paper-time">11:36&ndash;11:54</td>
                        <td>
                            <span class="paper-title">Textual Analogy Parsing: What's Shared and What's Compared among Analogous Facts.</span>
                            <em>Matthew Lamm, Arun Chaganty, Christopher D. Manning, Dan Jurafsky and Percy Liang</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1008" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305194870" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="2020">
                        <td id="paper-time">11:54&ndash;12:12</td>
                        <td>
                            <span class="paper-title">SWAG: A Large-Scale Adversarial Dataset for Grounded Commonsense Inference.</span>
                            <em>Rowan Zellers, Yonatan Bisk, Roy Schwartz and Yejin Choi</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1009" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305195438" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="2036">
                        <td id="paper-time">12:12&ndash;12:30</td>
                        <td>
                            <span class="paper-title">TwoWingOS: A Two-Wing Optimization Strategy for Evidential Claim Verification.</span>
                            <em>Wenpeng Yin and Dan Roth</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1010" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305195990" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="session session-expandable session-papers3" id="session-1c">
            <div id="expander"></div>
            <a href="#" class="session-title">1C: Vision</a>
            <br/>
            <span class="session-time" title="Friday, 2 November 2018">11:00 &ndash; 12:30</span>
            <br/>
            <span class="session-location btn btn--location">Silver Hall / Panoramic Hall</span>
            <br/>
            <div class="paper-session-details">
                <br/>
                <a href="#" class="session-selector" id="session-1c-selector">Choose All</a>
                <a href="#" class="session-deselector" id="session-1c-deselector">Remove All</a>
                <table class="paper-table">
                    <tr>
                        <td class="session-chair" colspan="2">Chair:
                            <a href="mailto:g.chrupala@uvt.nl">Grzegorz Chrupała</a>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="201">
                        <td id="paper-time">11:00&ndash;11:18</td>
                        <td>
                            <span class="paper-title">Associative Multichannel Autoencoder for Multimodal Word Representation.</span>
                            <em>Shaonan Wang, Jiajun Zhang and Chengqing Zong</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1011" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305209813" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="576">
                        <td id="paper-time">11:18&ndash;11:36</td>
                        <td>
                            <span class="paper-title">Game-Based Video-Context Dialogue.</span>
                            <em>Ramakanth Pasunuru and Mohit Bansal</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1012" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305210347" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="836">
                        <td id="paper-time">11:36&ndash;11:54</td>
                        <td>
                            <span class="paper-title">simNet: Stepwise Image-Topic Merging Network for Generating Detailed and Comprehensive Image Captions.</span>
                            <em>Fenglin Liu, Xuancheng Ren, Yuanxin Liu, Houfeng Wang and Xu Sun</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1013" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305210529" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1792">
                        <td id="paper-time">11:54&ndash;12:12</td>
                        <td>
                            <span class="paper-title">Multimodal Language Analysis with Recurrent Multistage Fusion.</span>
                            <em>Paul Pu Liang, Ziyin Liu, AmirAli Bagher Zadeh and Louis-Philippe Morency</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1014" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305210831" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1845">
                        <td id="paper-time">12:12&ndash;12:30</td>
                        <td>
                            <span class="paper-title">Temporally Grounding Natural Sentence in Video.</span>
                            <em>Jingyuan Chen, Xinpeng Chen, Lin Ma, Zequn Jie and Tat-Seng Chua</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1015" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/305211326" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="session session-expandable session-papers4" id="session-1d">
            <div id="expander"></div>
            <a href="#" class="session-title">1D: Entities &amp; Coreference</a>
            <br/>
            <span class="session-time" title="Friday, 2 November 2018">11:00 &ndash; 12:30</span>
            <br/>
            <span class="session-location btn btn--location">Hall 100 / Hall 400</span>
            <br/>
            <div class="paper-session-details">
                <br/>
                <a href="#" class="session-selector" id="session-1d-selector">Choose All</a>
                <a href="#" class="session-deselector" id="session-1d-deselector">Remove All</a>
                <table class="paper-table">
                    <tr>
                        <td class="session-chair" colspan="2">Chair:
                            <a href="mailto:eduardo.blanco@unt.edu">Eduardo Blanco</a>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="392">
                        <td id="paper-time">11:00&ndash;11:18</td>
                        <td>
                            <span class="paper-title">PreCo: A Large-scale Dataset in Preschool Vocabulary for Coreference Resolution.</span>
                            <em>Hong Chen, Zhenhua Fan, Hao Lu, Alan Yuille and Shu Rong</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1016" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306353798" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="627">
                        <td id="paper-time">11:18&ndash;11:36</td>
                        <td>
                            <span class="paper-title">Adversarial Transfer Learning for Chinese Named Entity Recognition with Self-Attention Mechanism.</span>
                            <em>Pengfei Cao, Yubo Chen, Kang Liu, Jun Zhao and Shengping Liu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1017" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306354811" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1286">
                        <td id="paper-time">11:36&ndash;11:54</td>
                        <td>
                            <span class="paper-title">Using Linguistic Features to Improve the Generalization Capability of Neural Coreference Resolvers.</span>
                            <em>Nafise Sadat Moosavi and Michael Strube</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1018" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306355512" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1574">
                        <td id="paper-time">11:54&ndash;12:12</td>
                        <td>
                            <span class="paper-title">Neural Segmental Hypergraphs for Overlapping Mention Recognition.</span>
                            <em>Bailin Wang and Wei Lu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1019" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306356485" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1846">
                        <td id="paper-time">12:12&ndash;12:30</td>
                        <td>
                            <span class="paper-title">Variational Sequential Labelers for Semi-Supervised Learning.</span>
                            <em>Mingda Chen, Qingming Tang, Karen Livescu and Kevin Gimpel</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1020" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306357379" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="session session-expandable session-papers5" id="session-1e">
            <div id="expander"></div>
            <a href="#" class="session-title">1D: Entities &amp; Coreference</a>
            <br/>
            <span class="session-time" title="Friday, 2 November 2018">11:00 &ndash; 12:30</span>
            <br/>
            <span class="session-location btn btn--location">Hall 100 / Hall 400</span>
            <br/>
            <div class="paper-session-details">
                <br/>
                <a href="#" class="session-selector" id="session-1d-selector">Choose All</a>
                <a href="#" class="session-deselector" id="session-1d-deselector">Remove All</a>
                <table class="paper-table">
                    <tr>
                        <td class="session-chair" colspan="2">Chair:
                            <a href="mailto:eduardo.blanco@unt.edu">Eduardo Blanco</a>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="392">
                        <td id="paper-time">11:00&ndash;11:18</td>
                        <td>
                            <span class="paper-title">PreCo: A Large-scale Dataset in Preschool Vocabulary for Coreference Resolution.</span>
                            <em>Hong Chen, Zhenhua Fan, Hao Lu, Alan Yuille and Shu Rong</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1016" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306353798" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="627">
                        <td id="paper-time">11:18&ndash;11:36</td>
                        <td>
                            <span class="paper-title">Adversarial Transfer Learning for Chinese Named Entity Recognition with Self-Attention Mechanism.</span>
                            <em>Pengfei Cao, Yubo Chen, Kang Liu, Jun Zhao and Shengping Liu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1017" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306354811" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1286">
                        <td id="paper-time">11:36&ndash;11:54</td>
                        <td>
                            <span class="paper-title">Using Linguistic Features to Improve the Generalization Capability of Neural Coreference Resolvers.</span>
                            <em>Nafise Sadat Moosavi and Michael Strube</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1018" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306355512" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1574">
                        <td id="paper-time">11:54&ndash;12:12</td>
                        <td>
                            <span class="paper-title">Neural Segmental Hypergraphs for Overlapping Mention Recognition.</span>
                            <em>Bailin Wang and Wei Lu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1019" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306356485" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                    <tr id="paper" paper-id="1846">
                        <td id="paper-time">12:12&ndash;12:30</td>
                        <td>
                            <span class="paper-title">Variational Sequential Labelers for Semi-Supervised Learning.</span>
                            <em>Mingda Chen, Qingming Tang, Karen Livescu and Kevin Gimpel</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1020" aria-hidden="true" title="PDF"></i>&nbsp;
                            <i class="fa fa-file-video-o video-icon" data="https://vimeo.com/306357379" aria-hidden="true" title="Video"></i>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="session session-expandable session-posters" id="session-poster-1">
            <div id="expander"></div>
            <a href="#" class="session-title">1E: Machine Translation &amp; Multilingual Methods (Posters and Demos)</a>
            <br/>
            <span class="session-time" title="Friday, 2 November 2018">11:00 &ndash; 12:30</span>
            <br/>
            <span class="session-location btn btn--location">Grand Hall</span>
            <div class="poster-session-details">
                <br/>
                <table class="poster-table">
                    <tr>
                        <td>
                            <span class="poster-type">Multilingual Methods</span>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="76">
                        <td>
                            <span class="poster-title">Joint Representation Learning of Cross-lingual Words and Entities via Attentive Distant Supervision.</span>
                            <em>Yixin Cao, Lei Hou, Juanzi Li, Zhiyuan Liu, Chengjiang Li, Xu Chen and Tiansi Dong</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1021" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="126">
                        <td>
                            <span class="poster-title">Deep Pivot-Based Modeling for Cross-language Cross-domain Transfer with Minimal Guidance.</span>
                            <em>Yftah Ziser and Roi Reichart</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1022" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="270">
                        <td>
                            <span class="poster-title">Multi-lingual Common Semantic Space Construction via Cluster-consistent Word Embedding.</span>
                            <em>Lifu Huang, Kyunghyun Cho, Boliang Zhang, Heng Ji and Kevin Knight</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1023" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="344">
                        <td>
                            <span class="poster-title">Unsupervised Multilingual Word Embeddings.</span>
                            <em>Xilun Chen and Claire Cardie</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1024" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="517">
                        <td>
                            <span class="poster-title">CLUSE: Cross-Lingual Unsupervised Sense Embeddings.</span>
                            <em>Ta Chung Chi and Yun-Nung Chen</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1025" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1036">
                        <td>
                            <span class="poster-title">Adversarial Propagation and Zero-Shot Cross-Lingual Transfer of Word Vector Specialization.</span>
                            <em>Edoardo Maria Ponti, Ivan Vulić, Goran Glavaš, Nikola Mrkšić and Anna Korhonen</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1026" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1093">
                        <td>
                            <span class="poster-title">Improving Cross-Lingual Word Embeddings by Meeting in the Middle.</span>
                            <em>Yerai Doval, Jose Camacho-Collados, Luis Espinosa Anke and Steven Schockaert</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1027" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1134">
                        <td>
                            <span class="poster-title">WikiAtomicEdits: A Multilingual Corpus of Wikipedia Edits for Modeling Language and Discourse.</span>
                            <em>Manaal Faruqui, Ellie Pavlick, Ian Tenney and Dipanjan Das</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1028" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1301">
                        <td>
                            <span class="poster-title">On the Relation between Linguistic Typology and (Limitations of) Multilingual Language Modeling.</span>
                            <em>Daniela Gerz, Ivan Vulić, Edoardo Maria Ponti, Roi Reichart and Anna Korhonen</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1029" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1439">
                        <td>
                            <span class="poster-title">A Fast, Compact, Accurate Model for Language Identification of Codemixed Text.</span>
                            <em>Yuan Zhang, Jason Riesa, Daniel Gillick, Anton Bakalov, Jason Baldridge and David Weiss</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1030" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1502">
                        <td>
                            <span class="poster-title">Personalized Microblog Sentiment Classification via Adversarial Cross-lingual Multi-task Learning.</span>
                            <em>Weichao Wang, Shi Feng, Wei Gao, Daling Wang and Yifei Zhang</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1031" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="2115">
                        <td>
                            <span class="poster-title">Cross-lingual Knowledge Graph Alignment via Graph Convolutional Networks.</span>
                            <em>Zhichun Wang, Qingsong Lv, Xiaohan Lan and Yu Zhang</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1032" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="2122">
                        <td>
                            <span class="poster-title">Cross-lingual Lexical Sememe Prediction.</span>
                            <em>Fanchao Qi, Yankai Lin, Maosong Sun, Hao Zhu, Ruobing Xie and Zhiyuan Liu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1033" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="2268">
                        <td>
                            <span class="poster-title">Neural Cross-Lingual Named Entity Recognition with Minimal Resources.</span>
                            <em>Jiateng Xie, Zhilin Yang, Graham Neubig, Noah A. Smith and Jaime Carbonell</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1034" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="poster-type">Machine Translation</span>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="310">
                        <td>
                            <span class="poster-title">A Stable and Effective Learning Strategy for Trainable Greedy Decoding.</span>
                            <em>Yun Chen, Victor O.K. Li, Kyunghyun Cho and Samuel Bowman</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1035" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="349">
                        <td>
                            <span class="poster-title">Addressing Troublesome Words in Neural Machine Translation.</span>
                            <em>Yang Zhao, Jiajun Zhang, Zhongjun He, Chengqing Zong and Hua Wu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1036" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="566">
                        <td>
                            <span class="poster-title">Top-down Tree Structured Decoding with Syntactic Connections for Neural Machine Translation and Parsing.</span>
                            <em>Jetic Gū, Hassan S. Shavarani and Anoop Sarkar</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1037" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="643">
                        <td>
                            <span class="poster-title">XL-NBT: A Cross-lingual Neural Belief Tracking Framework.</span>
                            <em>Wenhu Chen, Jianshu Chen, Yu Su, Xin Wang, Dong Yu, Xifeng Yan and William Yang Wang</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1038" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="683">
                        <td>
                            <span class="poster-title">Contextual Parameter Generation for Universal Neural Machine Translation.</span>
                            <em>Emmanouil Antonios Platanios, Mrinmaya Sachan, Graham Neubig and Tom Mitchell</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1039" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1069">
                        <td>
                            <span class="poster-title">Back-Translation Sampling by Targeting Difficult Words in Neural Machine Translation.</span>
                            <em>Marzieh Fadaee and Christof Monz</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1040" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1107">
                        <td>
                            <span class="poster-title">Multi-Domain Neural Machine Translation with Word-Level Domain Context Discrimination.</span>
                            <em>Jiali Zeng, Jinsong Su, Huating Wen, Yang Liu, Jun Xie, Yongjing Yin and Jianqiang Zhao</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1041" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1116">
                        <td>
                            <span class="poster-title">A Discriminative Latent-Variable Model for Bilingual Lexicon Induction.</span>
                            <em>Sebastian Ruder, Ryan Cotterell, Yova Kementchedjhieva and Anders Søgaard</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1042" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1436">
                        <td>
                            <span class="poster-title">Non-Adversarial Unsupervised Word Translation.</span>
                            <em>Yedid Hoshen and Lior Wolf</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1043" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1536">
                        <td>
                            <span class="poster-title">Semi-Autoregressive Neural Machine Translation.</span>
                            <em>Chunqi Wang, Ji Zhang and Haiqing Chen</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1044" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1542">
                        <td>
                            <span class="poster-title">Understanding Back-Translation at Scale.</span>
                            <em>Sergey Edunov, Myle Ott, Michael Auli and David Grangier</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1045" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1894">
                        <td>
                            <span class="poster-title">Bootstrapping Transliteration with Constrained Discovery for Low-Resource Languages.</span>
                            <em>Shyam Upadhyay, Jordan Kodner and Dan Roth</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1046" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1948">
                        <td>
                            <span class="poster-title">NORMA: Neighborhood Sensitive Maps for Multilingual Word Embeddings.</span>
                            <em>Ndapa Nakashole</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1047" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="1952">
                        <td>
                            <span class="poster-title">Adaptive Multi-pass Decoder for Neural Machine Translation.</span>
                            <em>Xinwei Geng, Xiaocheng Feng, Bing Qin and Ting Liu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1048" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="2056">
                        <td>
                            <span class="poster-title">Improving the Transformer Translation Model with Document-Level Context.</span>
                            <em>Jiacheng Zhang, Huanbo Luan, Maosong Sun, Feifei Zhai, Jingfang Xu, Min Zhang and Yang Liu</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1049" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="2139">
                        <td>
                            <span class="poster-title">MTNT: A Testbed for Machine Translation of Noisy Text.</span>
                            <em>Paul Michel and Graham Neubig</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-1050" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span class="poster-type">Demos</span>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="65-demo">
                        <td>
                            <span class="poster-title">CytonMT: an Efficient Neural Machine Translation Open-source Toolkit Implemented in C++.</span>
                            <em>Xiaolin Wang, Masao Utiyama and Eiichiro Sumita</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-2023" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                    <tr id="poster" poster-id="38-demo">
                        <td>
                            <span class="poster-title">SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing.</span>
                            <em>Taku Kudo and John Richardson</em>&nbsp;&nbsp;
                            <i class="fa fa-file-pdf-o paper-icon" data="http://aclweb.org/anthology/D18-2012" aria-hidden="true" title="PDF"></i>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
    <div class="session session-break session-plenary" id="session-lunch-3">
        <span class="session-title">Lunch</span>
        <br/>
        <span class="session-time" title="Friday, 2 November 2018">12:30 &ndash; 13:45</span>
    </div>
    <div id="generatePDFForm">
        <div id="formContainer">
            <input type="checkbox" id="includePlenaryCheckBox" value="second_checkbox"/>&nbsp;&nbsp;<span id="checkBoxLabel">Include plenary sessions in schedule</span>
            <br/>
            <a href="#" id="generatePDFButton" class="btn btn--twitter btn--large">Download PDF</a>
        </div>
    </div>
</div>