import * as fs from "fs";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

function displayCars(cars: Car[]) {
  console.log("------- Wagens -------");
  cars.forEach((car) => {
    console.log(`ID: ${car.id}`);
    console.log(`Merk: ${car.brand}`);
    console.log(`Model: ${car.model}`);
    console.log(`Jaar: ${car.year}`);
    console.log(`Prijs: €${car.price}`);
    console.log(`Actief: ${car.active ? "Ja" : "Nee"}`);
    console.log(`Brandstof: ${car.fuel}`);
    console.log(`Kleur: ${car.color}`);
    console.log(`Foto: ${car.image}`);
    console.log(`Beschrijving: ${car.description}`);
    console.log(`Transmissie: ${car.extra_info.transmission}`);
    console.log(`Aantal deuren: ${car.extra_info.number_of_doors}`);
    console.log(`Type: ${car.extra_info.type}`);
    console.log("----------------------");
  });
  displayMenu();
}

function findCarById(id: number, cars: Car[]): Car | undefined {
  return cars.find((car) => car.id == id);
}

function displayMenu() {
  console.log("\n------- Menu -------");
  console.log("1. Toon alle wagens");
  console.log("2. Zoek wagen bij ID");
  console.log("3. Afsluiten");
}

const rawData = fs.readFileSync("./cars.json");
const carsData: Car[] = JSON.parse(rawData.toString());

function main() {
  console.log("Welkom bij de JSON data viewer!\n");

  displayMenu();

  rl.on("line", (input: string) => {
    switch (input.trim()) {
      case "1":
        displayCars(carsData);
        break;
      case "2":
        rl.question("Voer het ID van de wagen in: ", (idInput) => {
          const id = parseInt(idInput);
          const foundCar = findCarById(id, carsData);
          if (foundCar) {
            displayCars([foundCar]);
          } else {
            console.log("Wagen niet gevonden!");
            displayMenu();
          }
        });
        break;
      case "3":
        console.log("Afsluiten van het programma. Tot ziens!");
        rl.close();
        break;
      default:
        console.log("Ongeldige keuze. Voer een nummer tussen 1 en 3 in.");
        displayMenu();
        break;
    }
  });
}

main();
