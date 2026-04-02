import {Request} from 'express'
import {JwtPayload} from 'jsonwebtoken'

export interface Decoded extends JwtPayload{
    userId: string, 
    role: string
}

export interface AuthRequest extends Request{
    user?:Decoded
}