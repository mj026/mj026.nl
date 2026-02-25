# Beautiful asserts with your Django Test Client
*March 27, 2023*

![Soup](/images/max-griss-unsplash-soup.jpg "Photo by Max Griss on Unsplash") When you write tests using the [Django Test Client](https://docs.djangoproject.com/en/4.1/topics/testing/tools/#the-test-client) you often want to check for error messages being displayed correctly or if a page renders specific HTML elements. Although [assertHTMLEqual](https://docs.djangoproject.com/en/4.1/topics/testing/tools/#django.test.SimpleTestCase.assertHTMLEqual) or [assertContains](https://docs.djangoproject.com/en/4.1/topics/testing/tools/#django.test.SimpleTestCase.assertContains) with the `html` parameter are useful for this, it doesn't feel very elegant to write asserts with HTML markup. Could there be a more sophisticated way?


### Minimal example

Let's first demonstrate how you would test a simple Django form and view with a *unit test* and a *functional/integration* test. I will use the term *functional test* from now on, as I use the Django Test Client mainly for testing *functionality* from a user's perspective.

We will use [pytest](https://docs.pytest.org/en/7.2.x/) with [pytest-django](https://github.com/pytest-dev/pytest-django) in this article, but the same principles apply if you use the default Django test runner.

Based on Adam Johnson's excellent [How to Unit Test a Django Form](https://adamj.eu/tech/2020/06/15/how-to-unit-test-a-django-form/), the basic principles of this article are: write unit tests to test the form thoroughly and write functional tests to check if the view that uses the form is functioning properly, without detailed testing of the form.

In any case, if you would like to see the full source code, including all the tests, or if you want to play around with the project, you can find it here: https://github.com/mj026/beautiful-asserts

So, let's get started with the core of the tested application, a simple *model* and *form*:

*models.py*
```python
class Article(models.Model):
    title = models.CharField(max_length=255)
```

*forms.py*
```python
class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ("title",)

    def clean_title(self):
        title = self.cleaned_data["title"]

        if not title[0].isupper():
            raise ValidationError("Should start with an uppercase letter")

        if "." in title:
            raise ValidationError("The period sign is not allowed")

        return title
```

#### Unit tests

First, we write a unit test for a *happy flow* scenario. When you enter a correct title, the form should be valid, and as a bonus, we could check if the form will create a new `Article` instance; it is a `ModelForm` after all:

```python
@pytest.mark.django_db
def test_article_form__correct_title():
    title = "My correct title"
    form = ArticleForm(data=dict(title=title))

    assert form.is_valid()
    assert isinstance(form.instance, Article)
    assert form.instance.title == title

```

Now we know the form will do its job with a well-formatted title, it's time to check if `clean_title` is functioning properly. Let's use `@pytest.mark.parametrize` for testing three scenarios:

- Titles should start with an uppercase letter
- The period sign is not allowed
- Title is a required field

```python
@pytest.mark.parametrize(
    "title,expected_error_message",
    (
        ("title not uppercased", "Should start with an uppercase letter."),
        ("My title with a period.", "The period sign is not allowed."),
        (None, "This field is required."),
    ),
)
@pytest.mark.django_db
def test_article_form__invalid_title(title, expected_error_message):
    form = ArticleForm(data=dict(title=title))
    assert not form.is_valid()

    assert "title" in form.errors
    assert form.errors["title"] == [expected_error_message]
```

With these tests, we are pretty sure the form will perform validation as desired, so we don't have to retest all of this again when writing functional tests.

### Functional tests

Now we know that the form is tested thoroughly, and we want to make sure that the view that uses the form is also functioning properly. The view should:

- Render and show the form
- Show error messages in case of an error
- Redirect to an overview page when all is fine

let's first start to check if the form is rendered correctly. The test is exaggerated a bit here for demonstration purposes:
```python
@pytest.mark.django_db
def test_article_create__get__assertContains(client):
    response = client.get(reverse("article-create"))

    assertContains(response, "<h1>Create Article</h1>", html=True)
    assertContains(response, '<form method="post">')
    assertContains(
        response,
        '<input type="text" name="title" maxlength="255" required="" id="id_title">',
        html=True,
    )
    assertContains(response, '<input type="submit" name="submit" value="Submit">')
```

Reading this immediately causes some itch: typing all this HTML makes it messy, challenging to read, and fault-tolerant. When frontend developers add or change HTML attributes / CSS classes in the template or change the way this form is displayed, this test will fail. Then we need to update the HTML in this test each time we change something. Not very efficient nor convenient.

To overcome this, you could write something like this:
```python
@pytest.mark.django_db
def test_article_create__get__assert_with_regex(client):
    response = client.get(reverse("article-create"))

    assert response.status_code == 200
    assert re.search("<h1.*>Create Article</h1>", str(response.content))
    assert re.search("<form.*>", str(response.content))
```

But this makes things even more itchy, and using regular expressions for parsing HTML tags is far from ideal. Next to that, frontend changes like CSS classes are most of the time not relevant for these tests: we just want to know if the form renders properly and that it's very likely that it *functions* correctly.

#### Alternatives

This makes you wonder if there is an alternative that isn't itchy. For E2E tests, you could use [Playwright](https://github.com/microsoft/playwright-pytest), and then you can use the [document.querySelector API](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) with CSS selectors. What if you could do that in your Django tests with the Django Test Client?


### Soup Sieve

Meet [Soup Sieve](https://github.com/facelessuser/soupsieve), an excellent selector add-on for [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/). It comes preinstalled with BeautifulSoup4 4.7.0 and above and uses the *CSS selector API* to query your document. A basic example:

```python
>>> from bs4 import BeautifulSoup
>>> soup = BeautifulSoup("<h1 class='title'>My title</h1>", "html5lib")
>>> soup.select("h1.title")
[<h1 class="title">My title</h1>]
```

To use this in our tests, you could simply write:
```python
def test_article_create__get(client):
    response = client.get(reverse("article-create"))
    soup = BeautifulSoup(response.content)
    assert soup.select(...)
```

### Custom Test Client

Let's integrate this in the Django Test Client so we don't have to "soupify" the response contents each time. We override the pytest `client` fixture with a customised version of the Django Test Client:

```python
class BS4DjangoTestClient(DjangoTestClient):
    def request(self, **request):
        response = super().request(**request)
        response.select = BeautifulSoup(response.content, "html5lib").select
        return response


@pytest.fixture
def client():
    return BS4DjangoTestClient()

```

Let's rewrite our first test, using CSS selectors with `select`:

```python
@pytest.mark.django_db
def test_article_create__get__select(client):
    response = client.get(reverse("article-create"))

    assert response.status_code == 200

    assert response.select("h1")[0].text == "Create Article"
    assert response.select("form")
    assert response.select("input[name='title']")
    assert response.select("input[type='submit']")
```

Another example, let's check if form errors are rendered properly:

```python
@pytest.mark.django_db
def test_article_create__post_error__select(client):
    data = dict(title="my title does not start with an uppercase")
    response = client.post(reverse("article-create"), data=data)

    assert response.status_code == 200
    assert response.select("ul.errorlist")

    error_messages = response.select("ul.errorlist li")
    assert len(error_messages) == 1
    assert error_messages[0].text == "Should start with an uppercase letter."
```

It became much easier now to query for specific elements, and we can even check easily how many error messages are shown. You could even check the specific error message if you'd like to.

More examples:
```python
# Check if the save button is present
assert response.select("form .buttonHolder button[name=save]")

# There should be a table with management links
links = response.select("table.overview tr td a")
assert len(links) > 0, "No management link found on the page!"

# Check if the href attribute contains the correct url
assert links[0].attrs["href"] == reverse("my-view", kwargs={"pk": article.pk})
```

### Final notes

Although [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/) has been around for a long time ([since 2004!](https://bazaar.launchpad.net/%7Eleonardr/beautifulsoup/bs4/view/head:/CHANGELOG#L1703)), it is the [Soup Sieve](https://github.com/facelessuser/soupsieve) add-on released in 2018 that makes it powerful and easy to query an HTML document. Integrating this into your Django Test Client requires just a few lines of code and makes writing tests much more convenient and robust.

#### Links

- [:link: Full source code repository](https://github.com/maerteijn/beautiful-asserts), in case you want to check out the code used in this article or run the tests yourself.
