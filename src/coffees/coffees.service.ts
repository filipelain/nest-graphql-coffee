import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInputError } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { CreateCoffeeInput } from './dto/create-coffee.input';
import { UpdateCoffeeInput } from './dto/update-coffee.input';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {

    constructor(
        @InjectRepository(Coffee) private readonly coffeeRepository: Repository<Coffee>,
        @InjectRepository(Flavor) private readonly flavorRepository: Repository<Flavor>,
        private readonly pubSup: PubSub
    ) { }
    async findAll(): Promise<Coffee[]> {
        return this.coffeeRepository.find();
    }

    async findOne(id: number): Promise<Coffee> {
        const coffeeResult = await this.coffeeRepository.findOne({ where: { id } });

        if (!coffeeResult) {
            throw new UserInputError(`Coffee #${id} does not exist`);
        }
        return coffeeResult;
    }
    async create(createCoffeeInput: CreateCoffeeInput): Promise<Coffee> {
        const flavors = await Promise.all(
            createCoffeeInput.flavors.map(name => this.prelaodFlavorByName(name))
        );

        const coffee = this.coffeeRepository.create({
            ...createCoffeeInput,
            flavors
        });
        const newCoffee = await this.coffeeRepository.save(coffee);
        this.pubSup.publish('coffeeAdded', { coffeeAdded: newCoffee })
        return newCoffee;
    }

    async update(id: number, updateCoffeeInput: UpdateCoffeeInput): Promise<Coffee> {
        const flavors = updateCoffeeInput.flavors && (await Promise.all(
            updateCoffeeInput.flavors.map(name => this.prelaodFlavorByName(name))
        ));

        const coffee = await this.coffeeRepository.preload({
            id,
            ...updateCoffeeInput,
            flavors
        });
        if (!coffee) {
            throw new UserInputError(`Coffee #${id} does not exist`);
        }
        return this.coffeeRepository.save(coffee);
    }

    async remove(id: number): Promise<Coffee> {
        const coffee = await this.findOne(id);
        return this.coffeeRepository.remove(coffee)
    }

    private async prelaodFlavorByName(name: string): Promise<Flavor> {
        const existingFlavor = await this.flavorRepository.findOne({
            where: { name }
        });
        if (existingFlavor) {
            return existingFlavor
        }
        return this.flavorRepository.create({ name })

    }

}
