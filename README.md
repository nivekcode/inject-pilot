# Inject pilot

![](logo.webp)

> Schematics to help you migrate constructor based injections in Angular code bases to inject

## Why should I migrate?
- Today's constructor based injections only work because Angular uses a flag that enables TypeScripts old behavior of how constructor properties are evaluated. Therefore using `inject` makes your code more future proof.
- When using constructor based injections in combination with injection tokens, you do not get proper type safety. With `inject` this is not a problem.
- `inject` makes it super convenient to inject services in combination with inheritance. No need for `super` calls.

[Find out more about advantages of using the inject function.](https://www.youtube.com/watch?v=GI5j3dJ6o90)

## Usage / Getting started
```
npx inject-pilot
```

