import express from 'express';
import path from 'path';
import fs from 'fs';
import connectToMongoDB from './mongoConnection';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

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
    id: number;
    transmission: string;
    number_of_doors: number;
    type: string;
}

// Lees het JSON-bestand en converteer de inhoud naar een array van Car-objecten
const rawData = fs.readFileSync(path.join(__dirname, 'cars.json'));
const carsData: Car[] = JSON.parse(rawData.toString());

async function importCarsDataToMongoDB(db: any) {
    try {
        const collection = db.collection('cars');
        const count = await collection.countDocuments();

        if (count === 0) {
            const carsDataPath = path.join(__dirname, 'cars.json');
            const carsData = await fs.promises.readFile(carsDataPath, 'utf-8');
            const parsedCarsData = JSON.parse(carsData);

            const result = await collection.insertMany(parsedCarsData);
            console.log(`${result.insertedCount} auto's zijn toegevoegd aan de database.`);
        } else {
            console.log('Autogegevens zijn al geïmporteerd naar MongoDB.');
        }
    } catch (error) {
        console.error(`Fout bij het importeren naar MongoDB: ${error}`);
    }
}

app.get('/', async (req, res) => {
    try {
        // Verbind met MongoDB
        const db = await connectToMongoDB();
        
        // Importeer auto-gegevens naar MongoDB
        await importCarsDataToMongoDB(db);
        
        // Haal de gegevens op uit de "cars" collectie
        const carsFromDB = await db.collection('cars').find({}).toArray();
        
        // Render de pagina met de opgehaalde gegevens
        res.render('overzicht', { cars: carsFromDB });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/detail/:id', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const db = await connectToMongoDB();
        const collection = db.collection('cars');
        const car = await collection.findOne({ id: carId });
        if (!car) {
            res.status(404).send('Auto niet gevonden');
            return;
        }
        res.render('detail', { car });
    } catch (err) {
        console.error('Error fetching data from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/overzicht', async (req, res) => {
    try {
        let filteredAndSortedCars = [];
        const db = await connectToMongoDB();
        const collection = db.collection('cars');
        const searchTerm = req.query.q as string;
        const sortBy = req.query.sortBy as keyof Car;
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

        if (searchTerm) {
            const regex = new RegExp(searchTerm, 'i');
            filteredAndSortedCars = await collection.find({ brand: regex }).toArray();
        } else {
            filteredAndSortedCars = await collection.find({}).toArray();
        }

        if (sortBy && Object.keys(filteredAndSortedCars[0]).includes(sortBy)) {
            filteredAndSortedCars.sort((a, b) => {
                if (sortBy === 'price') {
                    return (a[sortBy] - b[sortBy]) * sortOrder;
                } else {
                    if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
                    if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
                    return 0;
                }
            });
        }

        res.render('overzicht', { cars: filteredAndSortedCars });
    } catch (err) {
        console.error('Error fetching data from MongoDB:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
