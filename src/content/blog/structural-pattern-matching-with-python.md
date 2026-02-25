# Structural Pattern Matching with Python
*August 29, 2022*

![Structural Pattern Matching with Python](/images/python-structural-pattern-matching.jpg)Python has been designed to be a very readable and compact programming language [since the language was born in 1991](https://en.wikipedia.org/wiki/Python_(programming_language)). Indentation is required, semicolons are not needed, and readability and elegance are highly promoted, and I'm sometimes still stunned how complex use cases can be implemented so clean and simple with just a few lines of Python.

### Controverse
One of the things that has been controversial in the language for more than 30 (!) years (and a hot topic in the Python community) was the lack of a `switch` or `case` statement.

The [Python official FAQ](https://docs.python.org/3.9/faq/design.html#why-isn-t-there-a-switch-or-case-statement-in-python) wrote about this:
*You can do this easily enough with a sequence of* `if... elif... elif... else`.

### Some history regarding the `switch` statement

- In **2001**, [PEP-275](https://peps.python.org/pep-0275/) was submitted for Python 2 to introduce a `switch` statement in the language, but this was never accepted.

- In **2006**, Guido himself submitted the introduction of a `case` statement in [PEP-3103](https://peps.python.org/pep-3103/), but this was also rejected (by himself) because this proposal did not have *"popular support"*.

- It did take until **2020** for [PEP-634](https://peps.python.org/pep-0634/) and [PEP-635](https://peps.python.org/pep-0635/) to be proposed, which introduce a `case` statement, including advanced structural pattern matching as found in Haskell and Ruby.

- In October **2021**, a `match...case` statement was *finally* introduced in [Python 3.10](https://docs.python.org/3/whatsnew/3.10.html).

Let's see what it looks like with some examples.

### HTTP response handler example
For the following examples, we'll use a `Response` class that has two properties, a `status_code` (like `200` or `404`) and an `error_code`, such as `"invalid-credentials"`:
```python
@dataclass
class Response:
    status_code: int
    error_code: str
```
#### if / elif / else
If we were to make a handler to react to a specific response, we would traditionally write it like this:
```python
def handle_response(response):
    if response.status_code == 400:
        return BadRequestHandler(response)
    elif response.status_code == 403:
        error_message = response.body.json()["message"]
        return UnauthorizedHandler(response, message=error_message)
    elif response.status_code == 500:
        return ServerErrorHandler(response)
    else:
        return UnknownStatusCodeHandler(response)
```
It does the job, but still it looks a bit messy due to the different spacing, and this kind of code just screams for a better alternative.

#### Dictionary mapping
For a simple handling mechanism, you could use a dictionary to map the `status_code` to a specific handler:
```python
def handle_response(response):
    handler_mapping = {
        400: BadRequestHandler,
        403: UnauthorizedHandler,
        500: ServerErrorHandler,
    }
    handler = handler_mapping.get(
        response.status_code, UnknownStatusCodeHandler)

    return handler(response)
```

Although this already looks much cleaner compared to the `if... elif... else` example above, it has some limitations:

- If you need to write extra code before returning the correct handler (like extracting a message from the response), you'll need to add extra helper methods, which makes things messier.
- You are limited to the possible values of *dictionary keys*, no complex data structures or extra conditions are possible.

#### Matching statements
Rewriting the first example with the new [match...case](https://peps.python.org/pep-0622/) statement, it will look like this:
```python
def handle_response_match(response):
    match response.status_code:
        case 400:
            return BadRequestHandler(response)
        case 403:
            error_message = response.body.json()["message"]
            return UnauthorizedHandler(response, message=error_message)
        case 500:
            return ServerErrorHandler(response)
        case _:
            return UnknownStatusCodeHandler(response)
```

It's difficult to believe that this hasn't been added to the language earlier! These kinds of multi-condition statements are much more readable than the alternatives we were used to, and this makes the implementation of these kinds of handlers so much easier.

And there is even more, as the `match` statement can do some advanced matching like this:
```python
response = {
    "status_code": 403,
    "error_code": "invalid-credentials"
}

def handle_response(response):
    match response:
        case {"status_code": 403, "error_code": "invalid-credentials"}:
            # This handles a specific 403 response
            return InvalidCredentialsHandler(response)
        case {"status_code": 403, "error_code": error_code}:
            # This handlers all other 403 responses
            return BadRequestHandler(response, error_code)
        ...
```
Or even like this:
```python
def handle_response(response):
    match response:
        case Response(403, "invalid-credentials"):
            return InvalidCredentialsHandler(response)
        case Response(400, error_code):
            return NotFoundHandler(error_code)
        ...
```

When the `response` object is a tuple, you can even unpack the values like this:
```python
def handle_response(response):
    match response:
        case (404, error_code):
            return NotFoundHandler(error_code)
        case (403, "invalid-credentials"):
            return InvalidCredentialsHandler(response)
        case (403, error_code):
            return UnauthorizedHandler(response, error_code)
        ...
```

And you can even add more conditions with guards:
```python
def handle_response(response, user):
    match response:
        case (403, error_code) if user.authenticated:
            return NoPermissionHandler(response)
        case (403, error_code):
            return UnauthorizedHandler(response, error_code)
        ...
```

### Final notes
Go and check out [PEP-636](https://peps.python.org/pep-0636/), which contains even more great and advanced examples of what you can do with structural pattern matching in Python.

If you didn't find a good reason to update to Python 3.10 before, there is one now!
