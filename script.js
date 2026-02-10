let todos = [];
let isLoading = false;
const API_URL = "https://todolist-api.hexschool.io/todos/";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiItT2w1WVdVczYxM2pBenRKUE4xUCIsIm5pY2tuYW1lIjoiZXhhbXBsZTIyNSIsImlhdCI6MTc3MDcxMDM2MCwiZXhwIjoxNzcwOTY5NTYwfQ.v00eV63R9dLaxoM-ipbsK4zrIKL8fDWifjP8GFtdlok";

const todoList = document.getElementById("todoList");
const text = document.querySelector(".text");
const createTodo = document.querySelector(".create_todo");

// Loading 狀態
function showLoading() {
  isLoading = true;

  text.disabled = true;
  text.style.cursor = "not-allowed";

  createTodo.disabled = true;
  createTodo.style.opacity = "0.5";
  createTodo.style.cursor = "not-allowed";
}
function hideLoading() {
  isLoading = false;

  text.disabled = false;
  text.style.cursor = "text";

  createTodo.disabled = false;
  createTodo.style.opacity = "1";
  createTodo.style.cursor = "pointer";
}

// 取得資料
function fetchTodos() {
  showLoading();

  fetch(API_URL, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: token,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      todos = data.data;
      todos = Array.isArray(data.data) ? data.data : [];
      renderData();
    })
    .catch((err) => {
      console.error(err);
      alert("取得待辦資料失敗");
    })
    .finally(() => {
      hideLoading();
    });
}

// 初始渲染
fetchTodos();

// 渲染列表
function renderData() {
  const filteredData = getFilteredData();
  todoList.innerHTML = "";

  const defaultTemplate = `
    <li class="no-data">
      <p>目前尚無待辦事項</p>
    </li>
  `;

  const filteredTemplate = (isCompleted, todo) => `
    <label class="todoList_label">
      <input class="todoList_input" type="checkbox" ${isCompleted ? "checked" : ""} data-id="${todo.id}">
      <span></span>
    </label>
    <a href="#" class="delete_todo" data-id="${todo.id}">
      <i class="fa fa-times"></i>
    </a>
  `;

  const isEmptyData = filteredData.length === 0;

  if (isEmptyData) {
    todoList.innerHTML = defaultTemplate;
    updateCompletedCount();
    return;
  }

  filteredData.forEach(function (todo) {
    const li = document.createElement("li");
    const isCompleted = todo.status;

    li.innerHTML = filteredTemplate(isCompleted, todo);

    li.querySelector("span").textContent = todo.content;

    todoList.appendChild(li);
  });

  updateCompletedCount();
}

// 新增待辦功能
function createTodoItem(e) {
  e.preventDefault();

  if (isLoading) return;

  const todoItem = text.value.trim();

  if (todoItem === "") {
    alert("請輸入內容");
    text.value = "";
    return;
  }

  showLoading();

  const obj = {
    id: String(Date.now()), // 使用 Date.now() 生成唯一 id
    content: todoItem,
    status: false, // 預設為未完成
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  })
    .then((res) => res.json())
    .then(() => {
      text.value = "";
      fetchTodos(); // 新增成功後重新抓資料
    })
    .catch((err) => {
      console.error(err);
      alert("新增待辦失敗");
    })
    .finally(() => {
      hideLoading();
    });
}

createTodo.addEventListener("click", createTodoItem);

// 刪除待辦功能
function deleteTodoItem(e) {
  const deleteBtn = e.target.closest(".delete_todo");

  if (!deleteBtn) return;

  e.preventDefault();

  if (isLoading) return;

  const isConfirmed = confirm("確認刪除待辦事項？");

  if (!isConfirmed) return;

  showLoading();

  const id = deleteBtn.getAttribute("data-id");

  fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
    .then(() => {
      // API 刪除成功後，再更新本地陣列
      const index = todos.findIndex((todo) => todo.id === id);
      if (index !== -1) {
        todos.splice(index, 1);
        renderData();
      }
    })
    .catch((err) => {
      console.error(err);
      alert("刪除待辦失敗");
    })
    .finally(() => {
      hideLoading();
    });
}

todoList.addEventListener("click", deleteTodoItem);

// 取得篩選後的資料
function getFilteredData() {
  const activeTab = document.querySelector("#filterTabs a.active");
  const status = activeTab ? activeTab.getAttribute("data-status") : "all";

  switch (status) {
    case "pending":
      return todos.filter((todo) => !todo.status);
    case "completed":
      return todos.filter((todo) => todo.status);
    case "all":
    default:
      return todos;
  }
}

// 切換完成狀態功能
function toggleTodoStatus(e) {
  const checkbox = e.target;

  const isChecked = checkbox.classList.contains("todoList_input");

  if (!isChecked) return;

  if (isLoading) return;

  showLoading();

  const id = checkbox.getAttribute("data-id");
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    hideLoading();
    return;
  }

  const newCompleted = !todos[index].status;

  fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: newCompleted,
    }),
  })
    .then(() => {
      todos[index].status = newCompleted;
      renderData();
    })
    .catch((err) => {
      console.error(err);
      alert("切換完成狀態失敗");
      checkbox.checked = !checkbox.checked; // 失敗時復原
    })
    .finally(() => {
      hideLoading();
    });
}

todoList.addEventListener("change", toggleTodoStatus);

// 篩選顯示功能
const filterTabs = document.getElementById("filterTabs");
filterTabs.addEventListener("click", function (e) {
  const clickedLink = e.target.closest("a");
  if (!clickedLink) return;

  e.preventDefault();

  filterTabs.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
  clickedLink.classList.add("active");

  renderData();
});

// 更新完成數量功能
function updateCompletedCount() {
  const completedCount = todos.filter((todo) => todo.status).length;
  const countEl = document.getElementById("completed-count");
  countEl.textContent = completedCount;
}
