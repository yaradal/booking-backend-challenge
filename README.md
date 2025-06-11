# Backend Challenge - TypeScript

> If you want, you may also complete this challenge in: 
> [Python](https://github.com/limehome/backend-challenge-python)
> or
> [Java](https://github.com/limehome/backend-challenge-java)

## Context

We would like you to help us with a small service that we have for handling bookings. A booking for us simply tells us which guest will be staying in which unit, and when they arrive and the number of nights that guest will be enjoying our amazing suites, comfortable beds, great snac.. apologies - I got distracted. Bookings are at the very core of our business and it's important that we get these right - we want to make sure that guests always get what they paid for, and also trying to ensure that our unit are continually booked and have as few empty nights where no-one stays as possible. A unit is simply a location that can be booked, think like a hotel room or even a house. For the exercise today, we would like you to help us solve an issue we've been having with our example service, as well as implement a new feature to improve the code base. While this is an opportunity for you to showcase your skills, we also want to be respectful of your time and suggest spending no more than 3 hours on this (of course you may also spend longer if you feel that is necessary)

### You should help us:
Identify and fix a bug that we've been having with bookings - there seems to be something going wrong with the booking process where a guest will arrive at a unit only to find that it's already booked and someone else is there!
There are many ways to solve this bug - there is no single correct answer that we are looking for.

### Implement a new feature:
Allowing guests to extend their stays if possible. It happens that <strike>sometimes</strike> all the time people love staying at our locations so much that they want to extend their stay and remain there a while longer. We'd like a new API that will let them do that

While we provide a choice of projects to work with (either `TS`, `Python`, or `Java`), we understand if you want to implement this in something you're more comfortable with. You are free to re-implement the parts that we have provided in another language, however this may take some time and we would encourage you not spend more time than you're comfortable with!

When implementing, make sure you follow known best practices around architecture, testability, and documentation.


## How to run

### Prerequisutes

Make sure to have the following installed

- npm

### Setup


To get started, clone the repository locally and run the following

```shell
[~]$ ./init.sh
```

To make sure that everything is setup properly, open http://localhost:8000 in your browser and you should see an OK message.
The logs should be looking like this

```shell
The server is running on http://localhost:8000
GET / 200 3.088 ms - 16
```

To navigate to the swagger docs, open the url http://localhost:8000/api-docs/


### Running tests

There is one failing test, which is the first task of the challenge.
This test should pass - without changing the expected return code of course ;) - once you have fixed the bug. 
If you need to change the format of the object, or the given interface, please ensure all tests still pass.

```shell
[~]$ npm run test
...
 FAIL  test/booking.test.ts
  Booking API
    ✓ Create fresh booking (52 ms)
    ✓ Same guest same unit booking (16 ms)
    ✓ Same guest different unit booking (12 ms)
    ✓ Different guest same unit booking (12 ms)
    ✕ Different guest same unit booking different date (13 ms)
...
Test Suites: 1 failed, 1 total
Tests:       1 failed, 4 passed, 5 total
Snapshots:   0 total
Time:        0.984 s, estimated 1 s
Ran all test suites.
```

## Implementation notes

### Refactoring the environment management 
I felt it was weird to not be able to run the test suite and the app at the same time. I redid the way we managed the environment, so we can configure each independently. 
We could also consider having different databases for the app and the test suite in the future.

### Database changes
The database schema is designed to handle bookings efficiently and prevent double-bookings:

1. Date Range Storage: We store both `checkInDate` and `checkOutDate` to make overlap queries efficient. Although `checkOutDate` could be calculated from `checkInDate + numberOfNights`, storing it explicitly allows for faster queries and easier date range validations.

2. Composite Index: The `idx_booking_unit_dates` index on `[unitID, checkInDate, checkOutDate]` optimizes our overlap queries. This index is crucial for quickly finding conflicting bookings for a unit within a date range.

3. Composite Index: The `idx_booking_guest` index on `[unitID, checkInDate, checkOutDate]` helps enforce that a guest cannot be in multiple units simultaneously.

### Booking validation changes
Validate properly that a unit cannot be double-booked using this check:

The logic is:

**checkInDate < checkOut**: The existing booking starts before our booking ends.

**checkOutDate > checkIn**: The existing booking ends after our booking starts.

If both conditions are true, it means there's an overlap. This covers all possible overlap scenarios:
1. New booking's check-in falls within existing booking.
2. New booking's check-out falls within existing booking.
3. New booking completely encompasses existing booking.
4. Existing booking completely encompasses new booking.

### Refactoring the code into layers

I rearranged code into controller (for request handling), services (for business logic) and repository (for data access), because the code started to be hard to read.

### New feature added for extending booking

For the booking extension feature, I considered two main options.

- Creating a new booking for the extension:

This would allow reusing the same booking route, and conceptually, an extension could be treated as a new booking (especially since it may trigger a new payment). However, this approach would go against a rule from the initial requirements: a guest cannot book the same unit more than once.

- Updating the existing booking record:

This approach requires creating a separate route specifically for handling extensions. While it means we can no longer treat an extension as a separate booking, it preserves the uniqueness constraint and ensures the rule remains enforceable. This is the approach I've chosen for now, but this decision can be revisited in the future if our business logic evolves.

## TODOs

- A nice thing to do next would be to add proper validation to the controller to make sure everything that we're allowing is allowed. For example, check the booking unit exists, validate non-empty strings on name, unit, date validations, number of nights is a positive number...

- Dockerize the app for production.