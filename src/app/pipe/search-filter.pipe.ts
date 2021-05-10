import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchFilter'
})


export class SearchFilterPipe implements PipeTransform {

  // TOO: import a specific type Keyword for safety
  transform(value: any[], args?: any): any[] {
    if(!value) return null;
    if(!args) return value;

    args = args.toLowerCase();

    console.log("Filtering ", value, "after", args)

    return value.filter(function(data){
      return data.keyword.toLowerCase().includes(args);
    });
  }

}
