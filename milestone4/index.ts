import express, { Request as ExpressRequest, Response, NextFunction } from "express";
import path from "path";
import connectToMongoDB, { addDefaultUsers } from "./mongoConnection"; 
import dotenv from "dotenv";
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import session from "express-session";
import { User, IUser } from "./models/users";

enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
}

dotenv.config();

declare module "express-session" {
    interface Session {
        user?: IUser;
    }
}

declare global {
    namespace Express {
        interface Request {
            isAuthenticated: () => boolean;
        }
    }
}

interface QueryParams {
    q?: string;
    sortBy?: string;
    sortOrder?: string;
}

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "geheim",
        resave: false,
        saveUninitialized: true,
    })
);

const carSchema = new Schema({
    id: Number,
    brand: String,
    model: String,
    year: Number,
    price: Number,
    active: Boolean,
    fuel: String,
    color: String,
    image: String,
    description: String,
    extra_info: {
        transmission: String,
        number_of_doors: Number,
        type: String,
    },
});

const CarModel = mongoose.model<Car>("Car", carSchema);

interface Car {
    id: number;
    brand: string;
    model: string;
    year: number;
    price: number;
    active: boolean;
    fuel: string;
    color: string;
    image: string;
    description: string;
    extra_info: ExtraInfo;
}

interface ExtraInfo {
    transmission: string;
    number_of_doors: number;
    type: string;
}

const checkLoggedIn = (
    req: ExpressRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

const checkAdmin = (
    req: ExpressRequest,
    res: Response,
    next: NextFunction
) => {
    if (
        req.session &&
        req.session.user &&
        req.session.user.role === UserRole.ADMIN
    ) {
        next();
    } else {
        res.status(403).send("Toegang geweigerd");
    }
};

const checkNotLoggedIn = (
    req: ExpressRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.session || !req.session.user) {
        next();
    } else {
        res.redirect("/dashboard");
    }
};

app.get("/", checkNotLoggedIn, (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    if (req.session && req.session.user) {
        res.redirect("/dashboard");
    } else {
        res.render("login");
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send("Onjuist wachtwoord");
        }

        req.session.user = user;
        res.redirect("/dashboard");
    } catch (error) {
        console.error("Fout bij het inloggen:", error);
        res.status(500).send("Interne serverfout");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Fout bij uitloggen:", err);
            res.status(500).send("Interne serverfout");
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/register", (req, res) => {
    res.render("registratie");
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).send("Gebruikersnaam bestaat al");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            role: UserRole.USER,
        });

        await newUser.save();

        res.redirect("/login");
    } catch (error) {
        console.error("Fout bij registreren:", error);
        res.status(500).send("Interne serverfout");
    }
});

app.get("/dashboard", checkLoggedIn, (req, res) => {
    res.redirect("/overzicht");
});

app.get("/admin", checkLoggedIn, checkAdmin, (req, res) => {
    res.render("admin", { user: req.session.user });
});

app.post("/admin/edituser", checkLoggedIn, checkAdmin, async (req, res) => {
    const { username, role } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        user.role = role;
        await user.save();

        res.redirect("/admin");
    } catch (error) {
        console.error("Fout bij het wijzigen van gebruiker:", error);
        res.status(500).send("Interne serverfout");
    }
});

app.get("/detail/:id", async (req, res) => {
    const carId = req.params.id;
    try {
        const car = await CarModel.findOne({ id: carId });
        if (!car) {
            return res.status(404).send("Auto niet gevonden");
        }
        res.render("detail", { car });
    } catch (error) {
        console.error("Fout bij het ophalen van auto-informatie:", error);
        res.status(500).send("Interne serverfout");
    }
});

app.get("/overzicht", async (req: ExpressRequest<{}, {}, {}, QueryParams>, res) => {
    const { q, sortBy, sortOrder } = req.query;
    let query = {};

    if (q) {
        query = {
            $or: [
                { brand: { $regex: new RegExp(q, "i") } },
                { model: { $regex: new RegExp(q, "i") } }
            ]
        };
    }

    type SortOptions = { [key: string]: 'asc' | 'desc' };
    let sortOptions: SortOptions = {};
    if (sortBy && sortOrder) {
        sortOptions[sortBy] = sortOrder as 'asc' | 'desc';
    }

    try {
        const cars = await CarModel.find(query).sort(sortOptions);
        res.render("overzicht", { cars });
    } catch (error) {
        console.error("Fout bij het ophalen van auto's:", error);
        res.status(500).send("Interne serverfout");
    }
});

connectToMongoDB()
    .then(() => {
        console.log("Verbonden met MongoDB");
        return addDefaultUsers();
    })
    .then(() => {
        app.listen(port, () => {
            console.log(`Server gestart op http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error("Fout bij het verbinden met MongoDB:", error);
    });
