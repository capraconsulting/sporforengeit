import seedrandom from "seedrandom";
import animals from "./animals.json";

const numAnimalNames = animals.length;

export const randomAnimal = (seed?: string) => {
	if (seed === undefined) {
		const getRandomInt = (min: number, max: number) => {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};
		const animal = animals[getRandomInt(0, numAnimalNames - 1)];
		return `Anonym ${animal}`;
	} else {
		const random = seedrandom(seed);
		const animal = animals[Math.floor(random() * (numAnimalNames - 1))];
		return `Anonym ${animal}`;
	}
};
