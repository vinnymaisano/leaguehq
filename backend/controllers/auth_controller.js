import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose'
import { send_verification_email, send_reset_password_email } from '../utils/send_verification_email.js';
import { generate_token } from '../utils/generate_token.js';
import League from '../models/League.js';

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || ''

// TODO: forgot password

// create a new user
export async function register(req, res) {
    const session = await mongoose.startSession()
    // get login info
    let {username, email, password} = req.body
    username = username.trim()
    email = email.trim()
    password = password.trim()

    // server-side validation
    if (!username) {
        res.status(400).json({error: "No username provided"})
        return
    }

    if (!email) {
        res.status(400).json({error: "No email address provided"})
        return
    }

    if (!password) {
        res.status(400).json({error: "No password prvoided"})
        return
    }
    // if (password.length < 8) {
    //     res.status(400).json({success: false, message: "Password must be at least 8 characters."})
    //     return
    // }

    // if (! /[0-9]/.test(password)) {
    //     res.status(400).json({success: false, message: "Password must contain a number."})
    //     return
    // }
    // if (! /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //     res.status(400).json({success: false, message: "Password must contain a special character."})
    //     return
    // }

    try {
        // check if username or email already in use
        session.startTransaction()
        const exists = await User.findOne({ $or: 
            [
                { username: username.toLowerCase() }, 
                { email: email.toLowerCase() }] 
            }).session(session);
        if (exists) {
            await session.abortTransaction()
            res.status(400).json({error: "Username or email already in use"})
            return
        }

        const hashed_password = await bcrypt.hash(password, 12)
        const verification_token = generate_token()

        const new_user = new User({
            username,
            email,
            password: hashed_password,
            verification_token
        })

        await new_user.save({session})

        const token = jwt.sign({
            user_id: new_user._id, 
            username: new_user.username}, 
            JWT_SECRET, 
            {expiresIn: "1h"}
        )
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        await session.commitTransaction()
        await send_verification_email(email, verification_token)
            
        const user_obj = new_user.toObject()
        delete user_obj.password

        res.status(201).json({message: "User registered and logged in", user: user_obj})
    } catch (err) {
        await session.abortTransaction()
        // in case not found in User.findOne
        if (err.code === 11000) {
            res.status(400).json({ error: "Username or email already in use" });
            return
        } else {
            res.status(500).json({error: "Server error"})
            return
        }
    } finally {
        session.endSession()
    }
}

export async function login(req, res) {
    let {username, password} = req.body
    username = username.trim()
    password = password.trim()
    const input = username.toLowerCase()

    if (!username) {
        res.status(400).json({error: "No username or email provided"})
        return
    }
    if (!password) {
        res.status(400).json({error: "No password provided."})
        return
    }
    try {
        const user = await User.findOne({$or:
        [
            {username: input},
            {email: input}
        ]})

        if (!user) {
            res.status(400).json({error: "Invalid credentials"})
            return
        }

        const is_match = await bcrypt.compare(password, user.password)
        if (!is_match) {
            res.status(400).json({error: "Invalid credentials"})
            return
        }

        const token = jwt.sign({user_id: user._id, username: user.username}, JWT_SECRET, {expiresIn: "1h"})

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const user_obj = user.toObject()
        delete user_obj.password

        res.json({message: "Login successful", user: user_obj})
    } catch (err) {
        console.error(err)
        res.status(500).json({error: "Server error"})
    }
}

export async function edit_user(req, res) {
    if (!req.user) {
        res.json({success: false, message: "User is not logged in"})
        return
    }
    // console.log("req.user:", req.user)

    const {username, email, new_password, confirm_password} = req.body

    // console.log("Edit user:", req.body)

    // if (!new_password || !confirm_password) {
    //     res.status(400).json({success: false, message: "Both password fields are required"})
    //     return
    // }
    if (new_password !== confirm_password) {
        res.status(400).json({sucess: false, message: "Passwords do not match"})
        return
    }
    if (!username) {
        res.status(400).json({success: false, message: "No username provided"})
        return
    }
    if (new_password.length > 0 && new_password.length < 8) {
        res.status(400).json({success: false, message: "Password must be at least 8 characters."})
        return
    }
    if (new_password.length > 0 && ! /[0-9]/.test(new_password)) {
        res.status(400).json({success: false, message: "Password must contain a number."})
        return
    }
    if (new_password.length > 0 && ! /[!@#$%^&*(),.?":{}|<>]/.test(new_password)) {
        res.status(400).json({success: false, message: "Password must contain a special character."})
        return
    }
    if (!email) {
        res.status(400).json({success: false, message: "No email provided"})
        return
    }
    if (! /^\S+@\S+\.\S+$/.test(email)) {
        res.status(400).json({success: false, message: "Invalid email format"})
        return
    }

    const session = await mongoose.startSession()
    try {
        session.startTransaction();

        // get the current user
        const user = await User.findOne({ _id: req.user.user_id}).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update fields that were changed
        const email_changed = email !== user.email
        if (email_changed) {
            const existing = await User.findOne({email})
            if (existing) {
                return res.status(409).json({success: false, message: "Email already in use."})
            }
            // send a new verification email
            user.is_verified = false
            const verification_token = generate_token()
            user.verification_token = verification_token
            await send_verification_email(email, verification_token)
            // update email
            user.email = email
        }

        const username_changed = user.username !== username
        if (username_changed) {
            const existing = await User.findOne({username})
            if (existing) {
                return res.status(409).json({success: false, message: "Username already in use."})
            }
            user.username = username
        }
        
        const password_changed = new_password.length > 0 && confirm_password.length > 0
        if (password_changed) {
            const hashedPassword = await bcrypt.hash(new_password, 12)
            user.password = hashedPassword
        }
        
        await user.save({ session });
        await session.commitTransaction();

        return res.json({ success: true, message: "User profile updated successfully.", email_changed, username_changed, password_changed});

    } catch (err) {
        await session.abortTransaction();
        console.error("Error editing user:", err);
        return res.status(500).json({ success: false, message: err.message || "Internal server error" });
    } finally {
        session.endSession();
    }
}

export function logout(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
    })
    res.json({message: "Logged out successfully"})
}

export async function get_status(req, res) {
    if (!req.user) {
        res.json({is_authenticated: false})
        return
    }

    try {
        const user = await User.findById(req.user.user_id).select("-password")
        if (!user) {
            res.status(404).json({is_authenticated: false, message: "User not found"})
            return
        }
        // const user_obj = user.toObject()
        // delete user_obj.password

        res.json({is_authenticated: true, user})
    } catch (err) {
        res.status(500).json({is_authenticated: false, message: "Server error"})
    }

}

export async function delete_account(req, res) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const password = req.body?.password
        console.log("password:", password)

        if (!password) {
            res.status(400).json({success: false, message: "No password provided"})
            return
        }

        if (!req.user || !req.user.user_id) {
            res.status(401).json({success: false, message: "Not logged in"})
            return
        }

        const user = await User.findById(req.user.user_id).session(session)
        if (!user) {
            res.status(404).json({success: false, message: "User does not exist"})
            return
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            res.status(401).json({success: false, message: "Incorrect password"})
            return
        }

        // delete all leagues that this user owns
        await League.deleteMany({owner: user._id}).session(session)

        // Remove user from users and commissioners arrays where they are not owner
        await League.updateMany(
            { 
                owner: { $ne: user._id },
                $or: [
                    { users: user._id },
                    { commissioners: user._id }
                ]
            },
            {
                $pull: { 
                    users: user._id,
                    commissioners: user._id
                }
            }
        ).session(session);


        // Delete user
        await user.deleteOne({session})
        await session.commitTransaction()

        // Log user out
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
        })

        res.json({success: true, message: "User account deleted."})
        return
    } catch (err) {
        await session.abortTransaction()
        console.error("Error deleting account:", err)
        res.status(500).json({success: false, message: err.message || "Server error"})
        return
    } finally {
        session.endSession()
    }
}

export async function  get_user_info(req, res) {
    const user = req.user
    const data = await User.findOne({username: user.username})
    res.json(data)
}

export async function verify_email(req, res) {
    const {token} = req.query

    // check if token provided
    if (!token) {
        res.redirect(`${process.env.URL}/verify-email?status=missing`)
        return
    }

    try {
        // find a user with this verification token
        const user = await User.findOne({verification_token: token})
        if (!user) {
            res.redirect(`${process.env.URL}/verify-email?status=invalid`)
            return
        } else {
            user.is_verified = true
            user.verification_token = undefined
            await user.save()
        }   
        res.redirect(`${process.env.URL}/verify-email?status=success`)
    } catch (err) {
        res.redirect(`${process.env.URL}/verify-email?status=error`);
        return
    }
}

export async function resend_verification_email(req, res) {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
    }

    try {
        // find a user with the provided email
        const user = await User.findOne({ email: email.toLowerCase()});

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }
        // if user already verified, don't send email again
        if (user.is_verified) {
            res.status(400).json({ message: "User is already verified" });
            return
        }

        // generate a new verification token
        const verification_token = generate_token()
        user.verification_token = verification_token;
        await user.save();

        await send_verification_email(email, verification_token);

        res.json({ message: "Verification email resent" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export async function change_password(req, res) {
    const user_id = req.user?.user_id;
    const { current_password, new_password } = req.body;

    if (!user_id || !current_password || !new_password) {
        res.status(400).json({ error: "Missing fields" });
        return;
    }

    try {
        const user = await User.findById(user_id);

        const is_match = await bcrypt.compare(current_password, user.password);
        if (!is_match) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        user.password = await bcrypt.hash(new_password, 12);
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

export async function change_email(req, res) {
    const session = await mongoose.startSession()
    const user_id = req.user?.user_id
    const {current_email, new_email, password} = req.body
    
    if (!user_id || !current_email || !new_email || !password) {
        res.status(400).json({error: "Missing fields"})
        return
    }

    try {
        session.startTransaction()
        const user = await User.findById(user_id).session(session)

        // check if user exists
        if (!user) {
            await session.abortTransaction()
            res.status(404).json({error: "User not found"})
            return
        }

        // check if email provided matches
        if (current_email !== user.email) {
            await session.abortTransaction()
            res.status(400).json({error: "Current email does not match"})
            return
        }

        // authenticate
        const is_match = await(bcrypt.compare(password, user.password))
        if (!is_match) {
            await session.abortTransaction()
            res.status(401).json({error: "Incorrect passsword"})
            return
        }

        // check if the new email is already in use
        const email_exists = await User.findOne({email: new_email.toLowerCase()}).session(session)
        if (email_exists) {
            await session.abortTransaction()
            res.status(400).json({error: "New email is already in use"})
            return
        }

        // apply changes
        user.email = new_email
        user.is_verified = false
        user.verification_token = generate_token()
        await user.save({session})
        await session.commitTransaction()

        res.json({message: "Email changed successfully. Please verify the new email."})

        await send_verification_email(new_email, user.verification_token)
    } catch (err) {
        await session.abortTransaction()
        console.error(err)
        res.status(500).json({error: "Server error"})
        return
    } finally {
        session.endSession()
    }
}

// Send password reset email
export async function forgot_password(req, res) {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ success: false, message: "Email is required" })
        return
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user) {
            res.status(404).json({ success: false, message: "No user with this email" })
            return
        }

        const reset_token = generate_token()
        const token_expiry = Date.now() + 1000 * 60 * 60; // 1 hour

        user.reset_token = reset_token;
        user.reset_token_expiry = token_expiry;
        await user.save()

        const reset_link = `http://${process.env.URL}/reset-password/${reset_token}`
        await send_reset_password_email(email, reset_token);

        res.json({ success: true, message: "Password reset email sent" })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Server error" })
    }
}

// Reset password using token
export async function reset_password(req, res) {
    const { token } = req.params;
    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
        res.status(400).json({success: false, message: "Please fill all input fields."})
        return
    }
    if (new_password !== confirm_password) {
        res.status(400).json({success: false, message: "Passwords do not match."})
        return
    }
    if (new_password.length < 8) {
        res.status(400).json({success: false, message: "Password must be at least 8 characters."})
        return
    }
    if (new_password.length > 0 && ! /[0-9]/.test(new_password)) {
        res.status(400).json({success: false, message: "Password must contain a number."})
        return
    }
    if (new_password.length > 0 && ! /[!@#$%^&*(),.?":{}|<>]/.test(new_password)) {
        res.status(400).json({success: false, message: "Password must contain a special character."})
        return
    }

    try {
        const user = await User.findOne({
            reset_token: token,
            reset_token_expiry: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired token" })
            return
        }
        
        const hashed_password = await bcrypt.hash(new_password, 12)
        user.password = hashed_password
        user.reset_token = undefined
        user.reset_token_expiry = undefined
        await user.save()

        res.json({ success: true, message: "Password has been reset successfully" })
        return
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message || "Server error" })
    }
}