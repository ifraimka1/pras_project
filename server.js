import { createRequire } from "module";
import {fileURLToPath} from 'url';
import * as emailjs from "emailjs-com";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);

const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
import { authenticateDB, syncDB, authorizeRequest, disciplineFoldersList, disciplineSoftwareList, chatHistoryList } from './db.js';
const request = require('request');
const multer  = require("multer");
const path = require("path");
const fsPromises = require('fs/promises');
const lodash = require('lodash');
const crypto = require('crypto');

var XMLHttpRequest = require('xhr2');
var xhr = new XMLHttpRequest();

const app = express();
const port = 3000;
const software_guides_path = "http://127.0.0.1:3000/uploads/"
const fileserver_path = "E:/SfeduProjects/VKR/uploads/"

var { Liquid } = require('liquidjs');
var engine = new Liquid();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static(path.dirname(__filename)));
emailjs.init('bZttveUTXhH9SPYMx');

app.engine('liquid', engine.express()); 
app.set('views', './views');            // specify the views directory
app.set('view engine', 'liquid'); 
app.use(express.static(path.dirname(__filename) + '/public'));      // set liquid to default

authenticateDB();
syncDB();

var disciplinePublicList = "";
let current_user_role = "-1"; // 0 - admin, 1 - teacher, 2 - student
let selectedDiscipline = -1; // if -1 - not selected discipline now, else has selected
let current_username = "";
let current_user_id = -1;

let user_rolestring = "Войти";
var sortBy = 'ASC'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, getRandomedDate() + path.extname(file.originalname)) //Appending extension
    }
  })

  function getRandomedDate() {
    return Date.now() + Math.floor(Math.random() * (10000 - 100) + 100);
  }

const upload = multer({
    dest:"uploads",
     storage: storage,
     limits: { fileSize: 5 * 1024 * 1024 }, // Ограничение до 5 MB
     onError: function(err, next) {
        res.status(404).send();
     }
});

const multerErrorHandling = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      res.status(400).send("Multer error: " + err.message);
    } else {
      next();
    }
    };

var uploadAllGuidesForNewSoftware = upload.fields([
    {name: 'guide_use', maxCount: 1},
    {name: 'guide_install', maxCount: 1},
    {name: 'guide_description', maxCount: 1}
])

//СТРАНИЦА "НАЙТИ ПО"
app.get('/find_software', async (req, res) => {
    const search = req.query;

    const allDisciplines = await disciplineFoldersList.findAll({
        order: [
            ['discipline_name', sortBy],
        ],
    });
    let query = req.query.search_by;

    if (query == undefined) {
        query = "";
    }

    console.log("Requested discipline = " + query);

    let folderCount = allDisciplines.filter(x => x.discipline_name.includes(query)).map(x => x.get({plain:true})).length
    disciplinePublicList = allDisciplines.filter(x => x.discipline_name.includes(query)).map(x => x.get({plain:true}))

    const allDisciplinesModel = {
        disciplines: allDisciplines.filter(x => x.discipline_name.includes(query)).map(x => x.get({plain:true})),
        folder_count: folderCount,
        by_search_query: receiveFoundByQueryString(folderCount, query),
        by_query: query,
        user_role: current_user_role,
        user_role_string: formatForLoginButton()
    }

    
    res.render(detectLoginState('find_software'), allDisciplinesModel);
    console.log('Received disciplines list: ' + allDisciplinesModel.folder_count + 
    "; role = " + allDisciplinesModel.user_role +
    "; id = " + current_user_id);
});

function receiveFoundByQueryString(folderCount, query) {
 if (query == "") {
    return "Количество дисциплин в базе: " + folderCount;
 }
 else return "Найдено дисциплин в базе: " + folderCount;
}

async function detectLoginStateByString() {
    switch (current_user_role) {
        case "-1": return "Войти";
        case "0": return "Администратор";
        case "1": return "Преподаватель";
        case "2": return "Студент";
    }
}

function formatForLoginButton() {
    var result = "Профиль: ";
    if (current_username == "") {
        result = "Профиль: Гость";
    } else {
        result = "Профиль: " + current_username;
    }
    return result;
}

function detectLoginState(requiredPage) {
    if (current_user_role == -1) {
        return 'login';
    } else {
        return requiredPage;
    }
}

//УДАЛЕНИЕ ДИСЦИПЛИНЫ
app.get('/delete_discipline', async (req, res) => {
    disciplineFoldersList.destroy({
        where: {
            folder_id: req.query.id
        }
    })
    res.redirect('/find_software')
})

//ДОБАВЛЕНИЕ ДИСЦИПЛИНЫ
app.get('/add_discipline', async (req, res) => {
    if (req.query.name != "") {
            disciplineFoldersList.create({
        folder_id: Math.floor(Math.random() * (10000 - 10) + 10),
        discipline_name: req.query.name
    })
    }

    res.redirect('/find_software')
})

//ОЧИСТКА ПОИСКА ДИСЦИПЛИНЫ
app.get('/clear_search', async (req, res) => {
    res.redirect('/find_software')
})

//СТРАНИЦА КОГДА НАЖАЛИ НА ДИСЦИПЛИНУ В СПИСКЕ И ОТКРЫЛИСЬ ВСЕ ЕЁ ДОЧЕРНИЕ ЭЛЕМЕНТЫ
app.get('/selected_discipline', async (req, res) => {
     const allSoftware = await disciplineSoftwareList.findAll({
        where: {
          parent_folder_id: req.query.id
        }
      });

      selectedDiscipline = req.query.id;

      const softwareModel = {
        parent_folder_id: "default",
        software_count: allSoftware.map(x => x.software_id).length,
        software_list: allSoftware.map(x => x.get({plain:true})),
        software_id: allSoftware.map(x => x.software_id),
        software_name: allSoftware.map(x => x.software_name),
        software_link: allSoftware.map(x => x.software_link),
        user_role: current_user_role,
        user_role_string: formatForLoginButton(),
        discipline_name: req.query.name,

        files_path: software_guides_path
      }

      res.render(detectLoginState("selected_discipline"), softwareModel)

});

//СТРАНИЦА ВХОДА
app.get('/login', async (req, res) => {
    
    const loginPageModel = {
        user_role: current_user_role,
        user_role_string: detectLoginStateByString(),
        user_name: formatForLoginButton(),
        current_login: current_username
    }
    res.render('login', loginPageModel)
});

app.get('/logout', async (req, res) => {
    current_user_role = "-1"
    current_username = ""

    setTimeout(() => {
        res.redirect('/login')
    }, 500);
})

app.post('/updateDisciplineName', async (req, res) => {
    try {
        const newDisciplineName = req.body.edit_discipline_name;

        disciplineFoldersList.update(
            {discipline_name: newDisciplineName},
        {where: {
            folder_id: req.body.folderId
        }})

        setTimeout(() => {
            res.status(200).redirect('find_software');
        }, 1000);    } 
    catch (e) { console.log('Error while update folder name: ' + e); }
});

app.post('/edit_software', async (req, res) => {
    try {
        const newName = "Postgres Pro Standard";
        const newVersion = "16.3.2";

        console.log("software id = " + req.body.softwareId + "; new name = " + newName);

        disciplineSoftwareList.update(
            {   
                software_name: newName,
                software_version: newVersion
            },

            {where: {
                software_id: 3881
            }
        }
        )

        setTimeout(() => {
            res.status(200).redirect('find_software');
        }, 400);    
    } catch (e) { console.log('Error while update software: ' + e); }
});

//ОБРАБОТКА ЗАПРОСА ЛОГИНА
app.post('/handleLoginResponse', async (req, res) => {
    const username = req.body.login;
    const password = req.body.password;

    // Обработка полученных данных
    console.log('Получено: ', username, password);

    const findUser = await authorizeRequest.findOne({
        where: {
            user_login : username,
            user_password: password
        }
    }).then(user => {
        if (!user) {
            const infoModel = {
                message: "Введены неверные данные. Попробуйте войти снова",
                previous_page: '/login',
                user_role: current_user_role,
                user_role_string: detectLoginStateByString(),
            }
            res.render('info_page', infoModel) 
        } else {
            current_user_role = user.user_role;
            user_rolestring = "default";
            current_username = user.user_name;
            current_user_id = user.user_id;
            console.log('redirected to main page, role = ' + current_user_role);
            setTimeout(() => {
                res.status(200).redirect('find_software');
            }, 1000);
        }
    })
});

app.post("/add_software", uploadAllGuidesForNewSoftware, multerErrorHandling, function (req, res, next) {
    try {
    let software_name = req.body.software_name;
    let software_version = req.body.software_version;
    let guide_use = req.files.guide_use[0].filename;
    let guide_install = req.files.guide_install[0].filename;
    let guide_description = req.files.guide_description[0].filename;
    let software_link = req.body.software_link;

        disciplineSoftwareList.create({
            software_id: Math.floor(Math.random() * (10000 - 10) + 10),
            parent_folder_id: selectedDiscipline,
            software_name: software_name,
            software_version: software_version,
            software_description: guide_description,
            guide_installation: guide_install,
            guide_using: guide_use,
            software_link: software_link
        });

        console.log('Added new software in parent folder = ' + selectedDiscipline + '; name = ' + software_name);

    res.redirect('find_software');
    } catch (e) {
        console.log('Add software error: ' + e)
        res.send('Не все поля заполнены. Повторите попытку заново.') 
    }
});

app.get("/delete_software", async (req, res) => {
    try {
        let deletedSoftware = req.query.id;

        const soft = await disciplineSoftwareList.findOne({
            where: {
              software_id: deletedSoftware
            }
          });
    
          deleteFile(fileserver_path + soft.guide_using)
          deleteFile(fileserver_path + soft.guide_installation)
          deleteFile(fileserver_path + soft.software_description)
    
          disciplineSoftwareList.destroy({
            where: {
                software_id: deletedSoftware
            }
        })
        res.redirect('/find_software')
    } catch (e) {
        console.log('Error occured while delete software: ' + e);
    }
});

const deleteFile = async (filePath) => {
    try {
      await fsPromises.unlink(filePath);
      console.log('Successfully removed file on path ' + filePath + '!');
    } catch (err) {
      console.log(err);
    }
  };

  app.get('/current_chat', async (req, res) => {
    try {
        const chat_with_id = req.query.with;
        console.log('opened chat with id = ' + chat_with_id);

        const chatWithWho = await authorizeRequest.findOne({
            where: {
                user_id: chat_with_id
            }
        });

        const currentChat = await chatHistoryList.findAll({
            where: {
                sender_id : { [Op.or]: [current_user_id, chat_with_id]},
                receiver_id: { [Op.or]: [current_user_id, chat_with_id]},
            }
        });

        lodash.sortBy(currentChat, [(h) => h.message_date]);

        const currentChatModel = {
           history: currentChat.map(x => x.get({plain:true})),
           chat_with: chat_with_id,
           chat_with_name: chatWithWho.user_name,
           my_id: current_user_id,
           my_name: current_username,
           user_name: formatForLoginButton(),
           user_role_string: detectLoginStateByString()
        }

        console.log('model of chat = ' + currentChatModel);

        res.render( detectLoginState('current_chat'), currentChatModel);

    } 
    catch(e) {
        console.log('Error ocurred when open chat with id ' + req.query.with + ': ' + e);
    }
  });

  app.post('/sendMessage', async (req, res) => {
    try {
        chatHistoryList.create({
            message_id: getRandomedDate(),
            message_date: Date.now(),
            message_text: req.body.messagetext,
            sender_id: current_user_id,
            receiver_id: req.body.receiver
        });

        res.redirect("/current_chat?with=" + req.body.receiver);
    } catch (e) {
        console.log('Error occured with send message: ' + e);
    }
  });

  app.get('/chats', async (req, res) => {

    const userList = await authorizeRequest.findAll({
        where: {
            user_role: 1
        },
        order: [
            ['user_name', sortBy],
        ]
    })

    const userListModel = {
        users: userList.map(x => x.get({plain:true})),
        user_role_string: detectLoginStateByString(),
        user_name: formatForLoginButton()
    }
    res.render(detectLoginState('chats'), userListModel);
  });

  app.get('/info_page', async (req, res) => {
    const infoModel = {
        message: req.body.message,
        previous_page: req.body.previous_page,

    }
    res.render('info_page', infoModel)
  });

  app.post('/registerNewUser', async (req, res) => {
    try {
        console.log("new role = " + req.body.new_role);

        authorizeRequest.create({
            user_id: Math.floor(Math.random() * (10000 - 10) + 10),
            user_name: req.body.new_name,
            user_login: req.body.new_login,
            user_password: req.body.new_password,
            user_role: req.body.new_role
        })
    
        res.redirect('/find_software');
    } catch (e) {
        console.log('Some error occured while register new user: ' + e);
    }
  });

app.listen(port, () => console.log('Server was successfully started on port ' + port));