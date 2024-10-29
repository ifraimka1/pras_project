function sendLoginData() {
    var username = document.getElementById('login_input').value;
    var password = document.getElementById('password_input').value;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'handleLoginResponse', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // Действия при успешной обработке данных на сервере
                console.log('received code 200 and redirected to find software page')
                xhr.open("GET", "http://127.0.0.1:3000/find_software", true);
            } else {
                // Действия при ошибке
                console.log(xhr.status)
            }
        }
    };

    var data = JSON.stringify({ username: username, password: password });
    console.log("username password sended suka data = " + data)
    xhr.send(data);
}

function formatDate(receivedDate) {
    return receivedDate.getMonth();
}

