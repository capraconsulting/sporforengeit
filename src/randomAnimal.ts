import seedrandom from "seedrandom";
import { ANIMALS } from "./animals";

const numAnimalNames = ANIMALS ? ANIMALS.length : 0;

export const randomAnimal = (seed?: string) => {
  if (seed === undefined) {
    const getRandomInt = (min: number, max: number) => {
      const min2 = Math.ceil(min);
      const max2 = Math.floor(max);
      return Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
    };
    const animal = ANIMALS[getRandomInt(0, numAnimalNames - 1)];
    return `Anonym ${animal}`;
  } else {
    const random = seedrandom(seed);
    const animal = ANIMALS[Math.floor(random() * (numAnimalNames - 1))];
    return `Anonym ${animal}`;
  }
};
