const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail')
const tokenService =require('./token-service')
const UserDto =require('../dtos/user-dto')
const {Error} = require("mongoose");
const ApiError = require('../exceptions/api-error')
class UsersService {
    async registration (email, password) {
        // check is there in db user with this email
        const candidate = await UserModel.findOne({email})
        if (candidate) {
            throw ApiError.BadRequest('User already exist!')
        }
        // hashing password and create activation link
        const hashPassword = await bcrypt.hash(password, 3)
        const activationLink = uuid.v4()
        // save user in db and send him email to activate
        const user = await UserModel.create({email, password: hashPassword, activationLink})
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
        // ..., generate tokens and save in db
        const userDto = new UserDto(user); // id, email, isActivated
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
    }

    async login(email, password) {
        const user = await UserModel.findOne({email});
        if (!user) {
            throw ApiError.BadRequest('User not found!')
        }
        const isPasswordEqual = await bcrypt.compare(password, user.password);
        if (!isPasswordEqual) {
            throw ApiError.BadRequest('Incorrect password!')
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
    }

    async logout(refreshToken) {
        const token = tokenService.removeToken(refreshToken);
        return token;
    }
     async refresh(refreshToken) {
        if (!refreshToken) {
           throw ApiError.UnauthorizedError()
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = tokenService.findToken(refreshToken);

        if(!userData || !tokenFromDb) {
           throw ApiError.UnauthorizedError()
        }
        const user = await UserModel.findById(userData.id)
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
     }
    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink})
        if(!user) {
            throw ApiError.BadRequest('Activation link isn`t valid !')
        }
        user.isActivated = true;
        await user.save();

    }

    async getAllUsers() {
        // find return all if there is no props
        const users = await UserModel.find();
        return users;
    }
}

module.exports = new UsersService();