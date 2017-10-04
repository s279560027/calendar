function Calendar(options) {
    var events = {};
    var currentDate = options.date
    var grid = options.grid;

    var getMonthsNames = function() {
        var months = [];
        if(months.length == 0) {
            for(var i= 1; i <=12; i++) {
                months.push((new Date(0, i, 1)).toLocaleString('ru', {month: 'long'}));
            }
        }
        return months;
    }

    var setNavLabel = function() {
        options.nav.label.textContent = currentDate.toLocaleString('ru', {month: 'short'}) + ' ' + currentDate.getFullYear();
    }

    var dialog = function(target, options)
    {
        var coords, el;
        coords = getCoords(target);
        console.log(coords);
        el = document.createElement('div');
        el.className = 'popup';
        el.innerHTML = options.html + '<a id="closePopup" href="#"><i class="fa fa-times" aria-hidden="true"></i></a>';
        el.querySelector('#closePopup').addEventListener('click', handlers.closePopup.bind(el));
        el.style.left = typeof options.left != "undefined" ? options.left : coords.left;
        el.style.top = typeof options.top != "undefined" ? options.top : coords.top;;
        target.parentElement.appendChild(el);
    }

    var parseDate = function(dateString) {
        var date, months;
        date = dateString.split(' ');
        months = getMonthsNames();
        try {
            date = new Date(date[2], months.indexOf(date[1]), date[0]);
            return !isNaN(date.getTime())? date : false;
        } catch (e) {
            return false;
        }
    }

    handlers = {
        navLeftClick : function() {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            update();
        },
        navRightClick : function() {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            update();
        },
        navCurrentClick : function() {
            currentDate = new Date();
            update();
        },
        add : function(e) {
            months = getMonthsNames();

            dialog(options.add, {html :'<div><input id="eventParams" type="text" placeholder="1 сентябрь 2017, День Рождения" /><button id="createEvent" type="button">Создать</button></div>'});
            document.getElementById('createEvent').addEventListener('click', handlers.createEvent.bind(document.getElementById('eventParams')));
            document.getElementById('eventParams').addEventListener('keyup', handlers.typeEventField.bind(document.getElementById('eventParams')));
        },
        createEvent : function() {
            var date, eventKey, value;
            value = this.value.split(',');
            date = parseDate(value[0]);
            if(date) {
                eventKey = date.getTime().toString();
                events[eventKey] = {
                    date : date,
                    title : value.length > 1? value[1] : '',
                    members : '',
                    desc : '',
                }
                currentDate = date;
                update();
            } else {
                alert('Неверная дата');
            }
        },
        typeEventField : function(e) {
            var val, countParts;
            if(e.which == 8) {
                return false;
            }
            val = this.value.toString().split(' ');
            if(val.length == 1 && isNaN(parseInt(val[0]))) {
                this.value = '';
                return false;
            }
            if(val.length == 2 && val[1].length > 0) {
                var result = (',' + getMonthsNames().join(',,') + ',').match((new RegExp(','+val[1]+'[^,]*', 'g')));
                if(result && result.length == 1) {
                    val[val.length-1] = result[0].replace(',', '');
                    this.value = val.join(' ')+' ';
                }
            }
            if(val.length == 3 && isNaN(parseInt(val[2]))) {
                this.value = this.value.split(' ').slice(0, -1).join(' ') + ' ';
                return false;
            }
        },
        closePopup : function() {
            this.parentElement.removeChild(this);
        },

        grid : function(e) {
            var coords, el, html, event;
            e.stopPropagation();
            if(e.path[0].className.indexOf('active') !== -1) {
                coords = getCoords(e.path[0]);
                el = e.path[0];
                if(typeof events[el.id] != "undefined") {
                    event = events[el.id];
                    html = '<h2>'+events[el.id].title+'</h2><div>'+event.date.toString()+'</div><strong>Участники:</strong><br /><div>'+event.members+'</div> \
                    <textarea id="event-edit-desc">'+event.desc+'</textarea> \
                    <button type="button" id="view-event-done">Готово</button> \
                    <button type="button" id="event-delete">Удалить</button> \
                    ';
                    dialog(grid, {html : html, left: coords.left + 50, top: coords.top + 50});

                    document.getElementById('view-event-done').addEventListener('click', handlers.saveEvent.bind({id : el.id, target : document.getElementById('event-edit-desc')}));
                    document.getElementById('event-delete').addEventListener('click', handlers.deleteEvent.bind({id : el.id}));
                }



            }

            /*if(e.path[0].className.indexOf('active') !== -1) {
                coords = getCoords(e.path[0]);
                dialog(grid, {html : '<input type="text" id="edit-title" /><input type="text" id="edit-date" /><input type="text" id="edit-title" />', left: coords.left + 50, top: coords.top + 50});
            }*/
        },
        saveEvent : function() {
            if(typeof events[this.id] != "undefined") {
                events[this.id].desc = this.target.value;
            }
            update();
        },
        deleteEvent : function() {
            if(typeof events[this.id] != "undefined") {
                delete events[this.id];
            }
            update();
        }
    }

    drawGrid = function() {
        var month = currentDate.getMonth();
        var year = currentDate.getFullYear();
        var firstCDate = new Date(currentDate.getFullYear(), month, 0);
        var firstDay = firstCDate.getDay();
        var lastCDate = new Date(currentDate.getFullYear(), month + 1, 0);
        var lastDay = lastCDate.getDay() > 0? lastCDate.getDay() : 7;
        var endDate = new Date(year, month + 1, 8 - lastDay );

        var curDate = new Date(currentDate.getFullYear(), month, 1 - firstDay);
        var el;
        do {
            el = document.createElement('div');
            el.innerHTML = options.cellTemplate;
            if(typeof events[curDate.getTime()] != "undefined") {
                el.id = curDate.getTime();
                el.className = 'active';
                el.querySelector('.event-title').textContent = events[curDate.getTime()].title;
                el.querySelector('.event-members').textContent = events[curDate.getTime()].members;
                el.querySelector('.event-desc').textContent = events[curDate.getTime()].desc;
            }

            if(curDate.toDateString() == (new Date()).toDateString()) {
                el.className = 'current';
            }
            if(grid.children.length < 7)
                el.querySelector('.date').textContent += curDate.toLocaleString('ru', {weekday: 'long'}) + ', ';
            el.querySelector('.date').textContent += curDate.getDate();
            grid.appendChild(el);
            curDate.setDate(curDate.getDate() + 1);
        } while(curDate.getTime() < endDate.getTime());

    }

    var getCoords = function(elem) {
        var box;
        box = elem.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }

    options.nav.left.addEventListener('click', handlers.navLeftClick.bind(this));
    options.nav.right.addEventListener('click', handlers.navRightClick.bind(this));
    options.nav.current.addEventListener('click', handlers.navCurrentClick.bind(this));
    options.add.addEventListener('click', handlers.add.bind(this));
    options.grid.addEventListener('click', handlers.grid.bind(this));

    var update = function() {
        setNavLabel();
        grid.innerHTML = '';
        drawGrid();
    }

    update();
}


document.addEventListener("DOMContentLoaded", function(event) {
    var calendar = new Calendar({
        'grid' : document.getElementById('calendar-grid'),
        'date' : new Date(),
        'nav' : {
            'left' : document.getElementById('c-nav-left'),
            'label' : document.getElementById('c-nav-label'),
            'right' : document.getElementById('c-nav-right'),
            'current' : document.getElementById('current-button'),
        },
        'cellTemplate' : '<div class="date"></div><div class="event-title"></div><div class="event-members"></div><div class="event-desc"></div>',
        'add' : document.getElementById('add'),
    });
});