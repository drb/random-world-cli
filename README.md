## Random World CLI.

### CLI tools for generating real-looking random data using the random-world NPM library.

Quickly generate large flat files of "real looking" data (CSV, SQL insert scripts, unstructured text files) using the random-world library. Files can be generated on disk, or the output piped via stdout to any other programs.

**Installing:**

`npm install -g random-world-cli`

This will install the library to your `$PATH` so you can generate files from any directory.

**Random World**

All documentation for the methods exposed by the `random-world` library can be found on its [GitHub page](https://github.com/drb/random-world).

**Basics:**

Arguments that create random-goodness are passed to the program using `namespace`.`method` syntax e.g.

`random-world-cli names.title, names.fullname -r 5`

This will output 5 rows (`-r 5`) consisting of a person's title (`names.title`), their full name (`names.fullname`) and a city (`places.city`):

```
Miss, Adella Avery, Madaba
Mr, Freddie Karr, Liberia
Miss, Kaylene Odell, Delmar
Ms, Laronda Tate, Longyearbyen
Mrs, Esta Hutto, Monte Carlo
```

**Passing arguments to random-world methods**

Most RW methods accept arguments - these are passed into the library using the CLI interface by wrapping the args in square braces. **The entire namespace/method must be wrapped in single quotes when providing arguments**.

`random-world-cli 'numbers.integer[max: 2000]', 'places.city[country: France]' -r 5`

This will output 5 rows comprising of a random number with a limit of 2000, and a city limited to France:

```
1639, Maurecourt
1147, Saint-Germain-de-la-Grange
1913, Rosieres-aux-Salines
889, Rainneville
97, Morlaix
```

**CLI Options**

| Option        | Short Option  | Description  | Options |
| ------------- |:-------------:| -----:| ---------:|
| `̵̵format`        | -f            | Output formats | `stdout⎮csv⎮sql⎮text` |
| `̵̵rows`        | -r            | Number of rows to output | - |
| `̵̵output`        | -o            | File to write to | - |
| `̵̵headers`        | -h            | Headers for CSV files | Split with commas |
| `̵̵columns`        | -c            | Columns for SQL outputs | Split with commas |
| `̵̵table`        | -t            | Table name for inserting into when using SQL option | - |

**None RW values**

Any arguments passed into the library that cannot be resolved as a random-world method will be output to the stream as-is. For example:

`random-world-cli 'numbers.integer', 'some random value', places.city -r 5`

Outputs a random number (`numbers.integer`), the unresolvable string `some random value`, and a random city name `places.city`.

```
2225531, some random value, Cerknica
6225652, some random value, Bamako
8112931, some random value, Marigot
4795959, some random value, Skala
5756085, some random value, Saipan
```

**Documentation @TODOs**

- SQL types
- stdout piping
- CSV headers
