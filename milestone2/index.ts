import express from "express";
import * as path from "path";
import * as fs from "fs";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

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

const rawData = fs.readFileSync(path.join(__dirname, "cars.json"));
const carsData: Car[] = JSON.parse(rawData.toString());

app.get("/", (req, res) => {
  res.render("overzicht", { cars: carsData });
});
app.get("/detail/:id", (req, res) => {
  const carId = parseInt(req.params.id);
  const car = carsData.find((car) => car.id === carId);
  if (!car) {
    res.status(404).send("Auto niet gevonden");
    return;
  }
  res.render("detail", { car });
});

app.get("/overzicht", (req, res) => {
  let filteredAndSortedCars = [...carsData];

  const searchTerm = req.query.q as string;
  if (searchTerm) {
    filteredAndSortedCars = filteredAndSortedCars.filter((car) =>
      car.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const sortBy = req.query.sortBy as keyof Car;
  const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
  if (sortBy && Object.keys(carsData[0]).includes(sortBy)) {
    filteredAndSortedCars.sort((a, b) => {
      if (sortBy === "price") {
        return (a[sortBy] - b[sortBy]) * sortOrder;
      } else {
        if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
        if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
        return 0;
      }
    });
  }

  res.render("overzicht", { cars: filteredAndSortedCars });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
