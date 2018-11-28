function Person() {
}

let person = new Person();

// console.log(Person.prototype.isPrototypeOf(person));
// console.log(person.constructor.name);


function test(a, b) {
  console.log(a, b);
}

test(...{a: "hello"});