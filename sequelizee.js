const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:31052002@localhost:5432/rus_support_software');

const disciplineFoldersList = sequelize.define('discipline_folders', {
    folder_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
    },
    discipline_name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const disciplineSoftwareList = sequelize.define('discipline_software', {
    software_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
    },
    parent_folder_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    software_name: {
        type: DataTypes.STRING
    },
    software_link: {
        type: DataTypes.STRING
    },
    software_description: {
        type: DataTypes.STRING
    },
    guide_installation: {
        type: DataTypes.STRING
    },
    guide_using: {
        type: DataTypes.STRING
    }
})