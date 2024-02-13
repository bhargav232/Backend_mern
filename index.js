import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const app = express();

app.use(express.urlencoded({extended: true}))
const a = path.join(path.resolve(), ("public"))
app.use(express.static(a));
app.use(cookieParser());
app.set('view engine', 'ejs');




mongoose.connect("mongodb://127.0.0.1:27017/backend")
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((e) => {
        console.log("Error while connecting to mongodb:", e);
    });




const userSchema = mongoose.Schema({
    name: String,
    email:String,
    password:String
})

const User = mongoose.model("user", userSchema);


// handler

const isAuthenticated = async(req, res, next)=>{
    const{token} = req.cookies; 

    if(token)
    {
    const decoded = jwt.verify(token, "qwertyuiopasdfghjkl")
    req.user = await User.findById(decoded._id)

     next()
    }
    else{
        res.redirect("/login");
    }

}

app.get('/', isAuthenticated, (req, res) => {
  res.render("logout", {name: req.user.name});
});



app.post("/login", async (req, res) => {

    const { email, password} = req.body;

    let userIndb = await User.findOne({email})
    if(!userIndb){

       return res.redirect("/Register")
    }

    const isMatch = await bcrypt.compare(password, userIndb.password)
    if(isMatch){
        const token = jwt.sign({_id:userIndb._id}, "qwertyuiopasdfghjkl") 
            res.cookie("token", token,
            {httpOnly: true, 
        });
    res.redirect("/"); 
    }
    else{
        res.render("login" , {msg: "Incorrect password"})
    }
});

app.get("/login", (req,res)=>{
   res.render("login")
})

app.get("/Register", (req,res)=>{
    res.render("Register")
})

app.post("/Register", async (req,res)=>{
    const {name, email, password} = req.body;

    let userdb = await User.findOne({email})

    if(userdb){
       return  res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user  = await User.create({
        name,
        email,
        password: hashedPassword
    })

    const token = jwt.sign({_id:user._id}, "qwertyuiopasdfghjkl")
   
    res.cookie("token", token,
    {httpOnly: true, 
   });
   res.redirect("/")

    

})


app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    })
    res.redirect("/");
});




app.listen(5000, ()=>{
    console.log("In am listing on port 5000:  ")
})