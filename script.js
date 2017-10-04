function Calendar(options) {
    var events = {};
    var dialogElement;
    var currentDate = options.date
    var grid = options.grid;

    var getMonthsNames = function () {
        var months = [];
        if (months.length == 0) {
            for (var i = 1; i <= 12; i++) {
                months.push((new Date(0, i, 1)).toLocaleString('ru', {day: 'numeric', month: 'long'}).split(' ')[1]);
            }
        }
        return months;
    }

    var setNavLabel = function () {
        options.nav.label.textContent = currentDate.toLocaleString('ru', {month: 'short'}) + ' ' + currentDate.getFullYear();
    }

    var dialog = function (target, options) {
        var el;
        if (dialogElement && typeof(dialogElement['parentElement']) != "undefined" && dialogElement.parentElement) {
            return false;
        }
        var coords, el, bodyCoords, dialogWidth;
        bodyCoords = document.body.getBoundingClientRect();
        coords = getCoords(target);
        dialogElement = document.createElement('div');
        dialogElement.className = 'popup';
        dialogElement.innerHTML = options.html + '<a id="closePopup" href="#"><i class="fa fa-times" aria-hidden="true"></i></a>';
        dialogElement.querySelector('#closePopup').addEventListener('click', handlers.closePopup.bind(el));
        options.left = typeof options.left != "undefined" ? options.left : coords.left;
        options.top = typeof options.top != "undefined" ? options.top : coords.top;
        target.parentElement.appendChild(dialogElement);

        if (options.left + dialogElement.offsetWidth > bodyCoords.right) {
            options.left = bodyCoords.right - dialogElement.offsetWidth;
        }

        dialogElement.style.left = options.left;
        dialogElement.style.top = options.top;
        if (el = dialogElement.querySelector('input[type="text"]'))
            el.focus();
    }

    var dialogClose = function () {
        if (typeof dialogElement != "undefined" && typeof dialogElement.parentElement != "undefined") {
            dialogElement.parentElement.removeChild(dialogElement);
        }
    }

    var parseDate = function (dateString) {
        var date, months;
        date = dateString.split(' ');
        months = getMonthsNames();
        try {
            date = new Date(date[2], months.indexOf(date[1]), date[0]);
            return !isNaN(date.getTime()) ? date : false;
        } catch (e) {
            return false;
        }
    }

    handlers = {
        navLeftClick: function () {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            update();
        },
        navRightClick: function () {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            update();
        },
        navCurrentClick: function () {
            currentDate = new Date();
            update();
        },
        add: function (e) {
            var months = getMonthsNames();
            var coords = getCoords(options.add);
            var html = '<input id="eventParams" type="text" placeholder="1 сентябрь 2017, День Рождения" /><button id="createEvent" type="button">Создать</button>';
            dialog(options.add, {html: html, left: coords.left, top: coords.bottom + 15});
            document.getElementById('createEvent').addEventListener('click', handlers.createEvent.bind(document.getElementById('eventParams')));
            document.getElementById('eventParams').addEventListener('keyup', handlers.typeEventField.bind(document.getElementById('eventParams')));
        },
        createEvent: function () {
            var date, eventKey, value;
            value = this.value.split(/,| /ig);
            date = parseDate(value.splice(0, 3).join(' '));
            if (date) {
                eventKey = date.getTime().toString();
                events[eventKey] = {
                    date: date,
                    title: value.length > 0 ? value.join(' ') : '',
                    title: value.length > 0 ? value.join(' ') : '',
                    members: '',
                    desc: '',
                }
                currentDate = date;
                update();
                dialogClose();
                showEditForm(eventKey);
            } else {
                alert('Неверная дата');
            }
        },
        typeEventField: function (e) {
            var val, countParts;
            if (e.which == 8) {
                return false;
            }
            val = this.value.toString().split(' ');
            if (val.length == 1 && isNaN(parseInt(val[0]))) {
                this.value = '';
                return false;
            }
            if (val.length == 2 && val[1].length > 0) {
                var result = (',' + getMonthsNames().join(',,') + ',').match((new RegExp(',' + val[1] + '[^,]*', 'g')));
                if (result && result.length == 1) {
                    val[val.length - 1] = result[0].replace(',', '');
                    this.value = val.join(' ') + ' ';
                }
            }
            if (val.length == 3 && isNaN(parseInt(val[2]))) {
                this.value = this.value.split(' ').slice(0, -1).join(' ') + ' ';
                return false;
            }
        },
        closePopup: function () {
            dialogClose();
        },

        grid: function (e) {
            var coords, el, html, event, dialogForm, gridChild;

            gridChild = e.target;
            do {
                if (gridChild.className.indexOf('grid-cell') !== -1) {
                    showViewForm(gridChild.id);
                    break;
                }
                if (gridChild.className.indexOf('edit-link') !== -1) {
                    showEditForm(gridChild.parentElement.id);
                    break;
                }
                gridChild = gridChild.parentElement;
            } while (gridChild != grid)
        },
        saveEvent: function () {
            if (typeof events[this.id] != "undefined") {
                events[this.id].title = typeof this.title.value != undefined ? this.title.value : '',
                    events[this.id].date = typeof this.date.value != undefined ? this.date.value : '',
                    events[this.id].members = typeof this.members.value != undefined ? this.members.value : '',
                    events[this.id].desc = typeof this.desc.value != undefined ? this.desc.value : '';
            }
            update();
            dialogClose();
        },
        saveDesc: function () {
            if (typeof events[this.id] != "undefined") {
                events[this.id].desc = typeof this.desc.value != "undefined" ? this.desc.value : '';
            }
            update();
            dialogClose();
        },
        deleteEvent: function () {
            if (typeof events[this.id] != "undefined") {
                delete events[this.id];
            }
            dialogClose();
            update();
        },
        escapePressed: function (e) {
            if (e.which == 27)
                dialogClose();
        }
    }

    var showEditForm = function (id) {
        html = '<input id="event-edit-title" type="text" placeholder="Событие" /> \
                    <input id="event-edit-date" type="text" placeholder="Дата" /> \
                    <input id="event-edit-members" type="text" placeholder="Имена участников" /> \
                    <textarea id="event-edit-desc" placeholder="Описание"></textarea> \
                    <div><button type="button" id="event-done">Готово</button> \
                    <button type="button" id="event-delete">Удалить</button></div> \
                    ';
        coords = getCoords(document.getElementById(id));
        dialog(grid, {html: html, left: coords.left + 50, top: coords.top + 50});

        if (typeof events[id] != "undefined") {
            var event = events[id];
            document.getElementById('event-edit-title').value = event.title
            document.getElementById('event-edit-date').value = event.date.toLocaleString('ru', {
                day: 'numeric',
                year: 'numeric',
                month: 'long'
            })
            document.getElementById('event-edit-members').value = event.members;
            document.getElementById('event-edit-desc').value = event.desc;
        }

        document.getElementById('event-done').addEventListener('click', handlers.saveEvent.bind({
            id: id,
            title: document.getElementById('event-edit-title'),
            date: document.getElementById('event-edit-date'),
            members: document.getElementById('event-edit-members'),
            desc: document.getElementById('event-edit-desc'),
        }));
        document.getElementById('event-delete').addEventListener('click', handlers.deleteEvent.bind({id: id}));

    }

    var showViewForm = function (id) {
        html = '<div id="event-title" class="event-title"></div><br /><div id="event-date"></div><br /><strong>Участники:</strong><span id="event-members"></span> \
                    <textarea id="event-edit-desc"></textarea> \
                    <div> \
                    <button type="button" id="view-event-done">Готово</button> \
                    <button type="button" id="event-delete">Удалить</button> \
                    </div> \
                    ';
        coords = getCoords(document.getElementById(id));
        dialog(grid, {html: html, left: coords.left + 50, top: coords.top + 50});

        if (typeof events[id] != "undefined") {
            var event = events[id];
            document.getElementById('event-title').textContent = event.title
            document.getElementById('event-date').textContent = event.date.toLocaleString('ru', {
                year: 'numeric',
                month: 'short'
            });
            document.getElementById('event-members').textContent = event.members;
            document.getElementById('event-edit-desc').value = event.desc;
        }

        document.getElementById('view-event-done').addEventListener('click', handlers.saveDesc.bind({
            id: id,
            desc: document.getElementById('event-edit-desc'),
        }));
        document.getElementById('event-delete').addEventListener('click', handlers.deleteEvent.bind({id: id}));

    }

    drawGrid = function () {
        var month = currentDate.getMonth();
        var year = currentDate.getFullYear();
        var firstCDate = new Date(currentDate.getFullYear(), month, 0);
        var firstDay = firstCDate.getDay();
        var lastCDate = new Date(currentDate.getFullYear(), month + 1, 0);
        var lastDay = lastCDate.getDay() > 0 ? lastCDate.getDay() : 7;
        var endDate = new Date(year, month + 1, 8 - lastDay);

        var curDate = new Date(currentDate.getFullYear(), month, 1 - firstDay);
        var el;
        do {
            el = document.createElement('div');
            el.innerHTML = options.cellTemplate;
            if (typeof events[curDate.getTime()] != "undefined") {
                el.id = curDate.getTime();
                el.className = 'active grid-cell';
                el.querySelector('.event-title').textContent = events[curDate.getTime()].title;
                el.querySelector('.event-members').textContent = events[curDate.getTime()].members;
                el.querySelector('.event-desc').textContent = events[curDate.getTime()].desc;
            }

            if (curDate.toDateString() == (new Date()).toDateString()) {
                el.className += ' current';
            }
            if (grid.children.length < 7)
                el.querySelector('.date').textContent += curDate.toLocaleString('ru', {weekday: 'long'}) + ', ';
            el.querySelector('.date').textContent += curDate.getDate();
            grid.appendChild(el);
            curDate.setDate(curDate.getDate() + 1);
        } while (curDate.getTime() < endDate.getTime());

    }

    var getCoords = function (elem) {
        var box;
        box = elem.getBoundingClientRect();
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset,
            bottom: box.bottom + pageYOffset,
            right: box.right + pageXOffset,
        };
    }

    options.nav.left.addEventListener('click', handlers.navLeftClick.bind(this));
    options.nav.right.addEventListener('click', handlers.navRightClick.bind(this));
    options.nav.current.addEventListener('click', handlers.navCurrentClick.bind(this));
    options.add.addEventListener('click', handlers.add.bind(this));
    options.grid.addEventListener('click', handlers.grid.bind(grid));
    window.addEventListener('keyup', handlers.escapePressed.bind(this));

    var update = function () {
        setNavLabel();
        grid.innerHTML = '';
        drawGrid();
    }

    update();
}


document.addEventListener("DOMContentLoaded", function (event) {
    var calendar = new Calendar({
        'grid': document.getElementById('calendar-grid'),
        'date': new Date(),
        'nav': {
            'left': document.getElementById('c-nav-left'),
            'label': document.getElementById('c-nav-label'),
            'right': document.getElementById('c-nav-right'),
            'current': document.getElementById('current-button'),
        },
        'cellTemplate': '<div class="date"></div><div class="event-title"></div><div class="event-members"></div><div class="event-desc"></div><a href="#" class="edit-link fa fa-pencil-square-o" aria-hidden="true"></a>',
        'add': document.getElementById('add'),
    });
});