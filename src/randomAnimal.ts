import seedrandom from "seedrandom";
import { ANIMALS } from "./animals";

const numAnimalNames = ANIMALS ? ANIMALS.length : 0;

export const randomAnimal = (seed) => {
  if (seed === undefined) {
    const getRandomInt = (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const animal = ANIMALS[getRandomInt(0, numAnimalNames - 1)];
    return `Anonym ${animal}`;
  } else {
    const random = seedrandom(seed);
    const animal = ANIMALS[Math.floor(random() * (numAnimalNames - 1))];
    return `Anonym ${animal}`;
  }
};
