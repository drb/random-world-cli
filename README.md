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

`random-world-cli names.title, names.fullname, places.city -r 5`

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

`random-world-cli numbers.integer, 'some random value', places.city -r 5`

Outputs a random number (`numbers.integer`), the unresolvable string `some random value`, and a random city name `places.city`.

```
2225531, some random value, Cerknica
6225652, some random value, Bamako
8112931, some random value, Marigot
4795959, some random value, Skala
5756085, some random value, Saipan
```

**Escaping/Value Wrapping**

The program will attempt to escape values according to the output type and the type of the value. For example, a SQL output will wrap strings in quotes and leave ints/longs as the native value.

**Types - CSV**

The most common use-case for this program was to generate CSVs. The `-f --format` flag must be set to `csv`. Optionally, the `-h --headers` flag can be provided that will append the column headers (names) to the start of the CSV. Headers must be wrapped in single quotes and split by commas.

When the `--headers` flag is provided, the number of arguments provided must match the headers count.

**Types - SQL**

Bulk insert statements can also be generated for importing dummy data into SQL tables. When the `-f --format` flag is set to `sql`, the `-t --table` and `-c --columns` parameters must be provided. The columns provided must have the same count as the number of arguments the program will generate, otherwise an error will be raised.

`random-world-cli names.fullname, 'numbers.integer[max: 100]', places.street, places.city -r 5 -f sql --columns "name, age, address, city" --table tbl_People`

```
INSERT INTO tbl_People (name, age, street, city) VALUES ("Jerold Schwartz", 99, "69 Eat Avenue", "Port-aux-Francais");
INSERT INTO tbl_People (name, age, street, city) VALUES ("Leeann Padgett", 38, "147 Doctor Quay", "Piaski");
INSERT INTO tbl_People (name, age, street, city) VALUES ("Lorie Vest", 22, "133 Fine Mews", "Cotonou");
INSERT INTO tbl_People (name, age, street, city) VALUES ("Stephania Evans", 27, "123 With Crescent", "Koper");
INSERT INTO tbl_People (name, age, street, city) VALUES ("Tawna Ho", 2, "60 Slow Mews", "Gaborone");
```
**Types - stdout**

If the `-o --output` flag is not set, the data will be piped straight to `stdout`. This is useful for testing before writing files, or using to pipe to another program. For example. this output of 1000 names can be easily passed to `grep`.

`random-world-cli names.fullname -r 10000 | grep Dave`

```
Leon **Dave**nport
**Dave** Mccain
**Dave** **Dave**nport
**Dave** Kovach
```
