import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('postgres://postgres:admin@localhost:5432/sfedu_piaois');

// Подключение к базе данных
export const authenticateDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully.");
    } catch (error) {
        console.error("Database connection error:", error);
    }
};

export const authorizeRequest = sequelize.define('user_list', {
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_role: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
});

export const disciplineFoldersList = sequelize.define('discipline_folders', {
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

export const disciplineSoftwareList = sequelize.define('discipline_software', {
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
    software_version: {
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

export const chatHistoryList = sequelize.define('chat_history', {
    message_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    message_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    message_text: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sender_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    receiver_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
});

export const syncDB = async () => {
    try {
        // await Item.sync({ force: true });
        // await User.sync({ force: true });
        // await Order.sync({ force: true });
        // await OrderItem.sync({ force: true });
        // await Favorite.sync({ force: true });
        await sequelize.sync();
        console.log("Tables created (if they did not exist).");
    } catch (error) {
        console.error("Error creating tables:", error);
    }
};
