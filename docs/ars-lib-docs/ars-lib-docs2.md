# ArsLibrary - Dynamic composition of components

## Introduction

To reduce redundant implementation of e.g.: Dialog-Components, Input-Fields, the
``ArsComposeService`` can be used.

- ``ArsComposeService``
  - generates components within a given **host**
  - method to build components ``builder(host: ArsComposeHostDirective, e: (e: ArsComposeBuilder) => void): ComponentRef<any>[]``
- ``ArsComposeBuilder``
  - provides methods to build specific components
- ``ArsComposeHostDirective``
  - selector ``arsComposeHost``

### Creating a host

#### HTML
```html
<div arsComposeHost></div>
```

#### Typescript

```Typescript
@ViewChild(ArsComposeHostDirective) host:ArsComposeHostDirective;
constructor(public builder:ArsComposeService,...) {}
ngAfterViewInit(){
    this.builder.builder(this.host,e=>{
        e.button({
            translate:this.translate,
            callback:()=>{
                alert('Button pressed');
            },
            title:'This is a Button',
        });
    });
}
```

# ArsLibrary - Special Components

## ArsDateFormatter

Parameters
- ``date: Date``
- ``formatter: ArsDateFormatterService``

Implementation
```html
<ars-date-formatter
  [date]="comment.createdAt"
  [formatter]="dateFormatter">
</ars-date-formatter>
```
Note: Resolves to a value without a tag similar to ``{{ date.toString() }}``

>## Custom translation - How it works
>it automatically categorizes a date depending on the highest **'time unit'**
>
>e.g.: translation for hours is mapped to: x hours ago (but not more than 24 hours, because that
> would be a day)
>When saying "half an hour ago" due to it not being a complete hour, it's mapped to minutes.
>
>### Syntax:
>- First expression has the highest priority
>- An expression starts with `&` (unless it's the last/only expression: `&` is not needed)
>- An expression that starts with `&` **always** ends with `;`
>- An expression **can** contain a condition. if an expression contains a condition: `:`
   > **must** be written to differentiate between condition and translation _@see condition syntax_
>- if all previous expressions don't follow the condition: The last expression **can** be used
   > as 'default'.
>- depending on the mapping (**time unit**) `?` is the **time value**. meaning: if it's mapped
   > to e.g.: year `?` resolves to the amount of years _@see translation syntax_
>- tl;dr.: `& <time specification/condition @see condition syntax> : <translation @see
   > translation syntax> ;`
>
>#### condition syntax
>`&` **CONDITION** `:` TRANSLATION `;`
>- `#`: every number
>- `1-2`: from 1 to 2
>- `1`: exactly 1
>
>#### translation syntax
>`&` CONDITION `:` **TRANSLATION** `;`
>- `?`: number of the mapped translation
>- `TIME`: time e.g.: the exact time when a comment was created
>- `DATE`: date e.g.: the exact date when a comment was created
>- `%`: can only be used in last expression. When `?` is above 1, text following `%`, will be
   > displayed too (no whitespaces inbetween allowed) - it's a convinient way of differentiating between singular & plural forms. Instead of writing `&1:1 day ago;&#:? days ago` the whole expression can be written as `? day%s ago`
>
>## translation file
>```js
>
>export const arsTimeTranslation = {
>  de:{
>    time:{
>      year:
>        'vor ? Jahr%en am DATE um TIME',
>      month:
>        'vor ? Monat%en am DATE um TIME',
>      week:
>        'vor ? Woche%n am DATE um TIME',
>      day:
>        '&1:Gestern um TIME;' +
>        '&2:Vorgestern um TIME;' +
>        'vor ? Tag%en um TIME',
>      hour:
>        'vor ? Stunde%n',
>      minute:
>        '&10-20:vor einer viertel Stunde;' +
>        '&20-40:vor einer halben Stunde;' +
>        '&40-60:vor einer Stunde;' +
>        'vor ? minute%n',
>      second:
>        '&0-30:jetzt gerade;' +
>        'vor kurzem'
>    }
>  },
>  en:{
>    time:{
>      year:
>        '? year%s ago - DATE TIME',
>      month:
>        '? month%s ago - DATE TIME',
>      week:
>        '? week%s ago - DATE TIME',
>      day:
>        '&1:yesterday at TIME;' +
>        '? days ago at TIME',
>      hour:
>        '? hour%s ago',
>      minute:
>        '&10-20:quarter of an hour ago;' +
>        '&20-40:half an hour ago;' +
>        '&40-60:1 hour ago;' +
>        '? minute%s ago',
>      second:
>        '&0-30:just now;' +
>        'shortly ago'
>    }
>  }
>};
>
>```
