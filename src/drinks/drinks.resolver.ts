import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import * as GraphQLTypes from '../graphql-types'

@Resolver('DrinksResult')
export class DrinksResolver {

    @Query('drinks')
    async findAll(): Promise<GraphQLTypes.DrinksResult[]> {
        const coffee = new GraphQLTypes.Coffee();
        coffee.id = 1;
        coffee.name = 'Colombia';
        coffee.brand = 'Black colombia coffee';

        const tea = new GraphQLTypes.Tea();
        tea.name = 'Lipton'
        return [tea, coffee];
    }

    @ResolveField()
    __resolveType(value: GraphQLTypes.Drink) {
        // if('brand' in value){
        //     return 'Coffee';
        // }
        // return 'Tea';
        return Object.getPrototypeOf(value).constructor.name

    }
}
