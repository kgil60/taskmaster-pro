var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

$(".list-group").on("click", "p", function() {
  let text = $(this).text().trim();
  let textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);
  textInput.trigger("focus");
})

$(".list-group").on("blur", "textarea", function() {
  // get textareas current value/text
  let text = $(this)
    .val()
    .trim();
  
  // get parent ul's id attribute
  let status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

    // get tasks position on list of other li elements
    let index = $(this)
      .closest(".list-group-item")
      .index();

    tasks[status][index].text = text;
    saveTasks();

    // recreate p element
    let taskP = $("<p>")
      .addClass("m-1")
      .text(text);

    // replace text area with p
    $(this).replaceWith(taskP);
})

// due date was clicked
$(".list-group").on("click", "span", function() {
  // get current date
  let date = $(this)
    .text()
    .trim();

  // create new input element
  let dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);
  
  // swap out elements
  $(this).replaceWith(dateInput);

  // enabel jquery ui datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function () {
      $(this).trigger("change");
    }
  })

  // automatically focus on new element
  dateInput.trigger("focus");
})

// value of due date was changed
$(".list-group").on("change", "input[type='text']", function() {
  // get current date
  let date = $(this)
    .val()
    .trim();

  // get parent ul's id attribute
  let status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get tasks position in list of other li elements
  let index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array adn resave to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  let taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass tasks li el into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
})


// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(e) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(e) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(e) {
    $(this).addClass("dropover-active");
  }, 
  out: function(e) {
    $(this).removeClass("dropover-active");
  },
  update: function(e) {
    // array to store task data
    let tempArr = [];

    // loop over current set of chilren in sortable list
    $(this).children().each(function() {
      let text = $(this)
        .find("p")
        .text()
        .trim();
      
      let date = $(this)
        .find("span")
        .text()
        .trim();

      tempArr.push({
        text: text,
        date: date
      })
    })
    // trim down list id to match object property
    let arrName = $(this)
    .attr("id")
    .replace("list-", "");
  
    tasks[arrName] = tempArr;
    saveTasks();

    console.log(tempArr)
  }
})

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(e, ui) {
    ui.draggable.remove();
  },
  over: function(e, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(e, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
})

$("#modalDueDate").datepicker({
  minDate: 0
});

function auditTask(taskEl) {
  // get date from task el
  let date = $(taskEl).find("span").text().trim();
  // ensure it worked
  console.log(date);

  // convert to moment object at 5pm
  let time = moment(date, "L").set("hour", 17);
  
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
}

setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  })
}, 1800000);

// load tasks for the first time
loadTasks();


