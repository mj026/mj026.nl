# Django sync or async, that's the question
*January 21, 2025*

![Django sync or async](/images/benchmarks/uwsgi-1-process-100-threads.png)In the current world of cloud-hosted services, the need to integrate such a service into your project by using an API is more the rule than the exception. When you integrate such a service in your "sync" Django project, you can run into concurrency issues pretty fast. We have an [async, coroutine-based stack now in Django](https://docs.djangoproject.com/en/5.1/topics/async/), would it be beneficial? Let's try to find out by diving into the Python world of concurrency handling and by testing (and benchmarking) a test application with both "sync" and "async" solutions.

## Know thy options

We first need a bit of background information and to understand the terminology and implications before we can make a considered assessment. "Async" is the newest kid on the block, but Django's codebase still has a lot of "sync" parts (like all generic views and forms). Async also adds complexity, and the benefits might not outweigh the extra burden. But what is this async all about? It's all about handling concurrency.


### Handling concurrency
For a web application to handle concurrency, there are roughly two flavours:

- A web server that runs one or more processes that spawn threads for each request:
![Processes and threads](/images/threads.png =800x430)

- A "no threads" single web server, running callbacks or coroutines via an event loop:
![Event loop](/images/event-loop.png =800x430)

Combinations do exist too: an event loop with native threads (or vice versa), multiprocessing with multiple event loops with coroutines or callbacks / events, greenlets (or "green" threads), task queues, etc., but for this blog post we'll stick with these two, as these are the most distinct forms of (web-based) concurrency handling. Alternative definitions used for these two forms are *preemptive multitasking* and *cooperative multitasking*:

- With [preemptive multitasking](https://en.wikipedia.org/wiki/Preemption_(computing)#PREEMPTIVE) the OS kernel decides the amount of time each task (thread) will get. It will mostly divide the available time equally and can give prejudice to important events. When using (POSIX) processes and threads, you are utilising preemptive multitasking.
- With [cooperative multitasking,](https://en.wikipedia.org/wiki/Cooperative_multitasking) the application process / task itself decides when to give control to another task. When a task suspends itself (when invoking `yield` or `await`), the next task will be allowed to execute. It's called "cooperative" because a task needs to cooperate with others by using an explicit suspend, saying "now another task can use the CPU". Coroutine-based programming is a form of cooperative multitasking.


## Let's get back to the question

#### Sync
Writing code for a Django application was mostly done "sync". You expect the web application server (like `uwsgi` or `gunicorn`) to take care of the concurrency issues with multiple processes and/or threads. The complete request / response loop is **blocking**: a thread or process is literally blocked until all the code is executed and a response is given.

This includes waiting for results like a database query or network call. You can still do all you want in parallel in your application, though, like spawning multiple threads, but the dedicated thread **handling your request** is blocked until the response. The slower the processing of your requests, the fewer requests can be handled simultaneously.

 In the Python world, the interface between your application and the web application server (including the request / response loop) is standardised as such in the [WSGI standard](https://en.wikipedia.org/wiki/Web_Server_Gateway_Interface).

> **GIL**
> Note that in Python spawned threads cannot really run concurrently, which has to do with the [GIL (Global Interpreter Lock)](https://en.wikipedia.org/wiki/Global_interpreter_lock), unless you are using C extensions where you can release the GIL or use the [new free threading mode in Python 3.13](https://docs.python.org/3/howto/free-threading-python.html). This mainly means multithreaded applications can't really use multiple cores on a single CPU (in a single process) either, as only one thread can be active at a time. However, when the threads are waiting mainly for IO, it's still beneficial to use threads.


#### Async
With async programming, you are aware of concurrency in the application layer. In other words, you will write code that is prepared and *aware* of being concurrent, and most importantly, *when*. This can be event-driven (such as good old [Twisted](https://github.com/twisted/twisted)), with "implicit" coroutine libraries (such as [Gevent](https://www.gevent.org/)), or with `asyncio` and the `async` / `await` keywords (such as [Starlette](https://www.starlette.io/) and [FastAPI](https://fastapi.tiangolo.com/)). The `async` / `await` keywords and the `asyncio` (formally known as [Tulip](https://peps.python.org/pep-3156/#status)) library got standardised in Python in version [3.4](https://docs.python.org/3/whatsnew/3.4.html#whatsnew-asyncio) and [3.5](https://docs.python.org/3/whatsnew/3.5.html). Django received async support (with `asyncio`) in [version 3.1](https://docs.djangoproject.com/en/5.1/releases/3.1/#asynchronous-views-and-middleware-support) and this was expanded further in [4.0](https://docs.djangoproject.com/en/5.1/releases/4.0/#cache), [4.1](https://docs.djangoproject.com/en/5.1/releases/4.1/#asynchronous-handlers-for-class-based-views), [4.2](https://docs.djangoproject.com/en/5.1/releases/4.2/#minor-features) and [5.1](https://docs.djangoproject.com/en/5.1/releases/5.0/#django-contrib-auth).

`WSGI` was not suitable for async due to its blocking nature; therefore, a new standard was developed for Python applications: [ASGI](https://asgi.readthedocs.io/en/latest/).

> **Django channels**
> [Django channels](https://channels.readthedocs.io/en/latest/introduction.html) is an add-on package for Django for handling [WebSockets](https://en.wikipedia.org/wiki/WebSocket) and other protocols which are not HTTP (although it can). It is depending on [Daphne](https://github.com/django/daphne), the first ASGI server, based on [Twisted](https://twisted.org/). The first version of Django channels in 2016 did not make use of `asyncio`, nor did the first version of Daphne. With the releae  [Daphne 2.0.0](https://github.com/django/daphne/blob/main/CHANGELOG.txt#L282) and Channels [2.0.0](https://channels.readthedocs.io/en/stable/releases/2.0.0.html) (2018), both were rewritten to use `asyncio` and `async` / `await`.


##### Implicit and explicit coroutines
When you are writing "sync" code and use a library like [Gevent](https://www.gevent.org/) (with or without monkey patching), you are using coroutines in an *implicit* manner. In the case of monkey patching, you are not even aware of the fact that coroutines are scheduled on an event loop. So while Gevent can be a terrific solution, it can also be very difficult to tell when and why things go wrong. 

Especially when you are running threads that have no IO at all (so there is no suspend, which can make your whole application block). When you are using the `async` / `await` keywords in conjunction with `asyncio` (or any other event loop engine), you are using coroutines *explicitly*, as you can exactly see in which places in your codebase the coroutine will suspend. This makes it easier to spot problems and, of course, more obvious to see what is going on.

> **asyncio**
> Asyncio was [not only received with applause](https://lucumr.pocoo.org/2016/10/30/i-dont-understand-asyncio/) when it was released. It still [receives a lot of criticism](https://charlesleifer.com/blog/asyncio/). The package was added to the standard library before the `async` / `await` keywords were added, so it had backward compatibility issues since the start. The package itself was heavily improved (and changed) in newer Python versions, as of [3.8](https://docs.python.org/3/whatsnew/3.8.html#asyncio), [3.9](https://docs.python.org/3/whatsnew/3.9.html#asyncio), [3.11](https://docs.python.org/3/whatsnew/3.11.html#asyncio) and [3.13](https://docs.python.org/3/whatsnew/3.13.html#asyncio). A lot of improvements has been added because of development in alternative async libraries like [Trio](https://trio.readthedocs.io/en/stable/) (and [Curio](https://curio.readthedocs.io/en/latest/)). [AnyIO](https://anyio.readthedocs.io/en/stable/) is now a popular library as it exposes a single API to work both with the `asyncio` and `trio` libraries.


## Benchmarks
So now we know a bit about all the technology and how they work; let's do some benchmarks on how the different stacks respond. Note that these are not *100% true scientific benchmarks*. The benchmarks mostly show the characteristics of the different stacks in the context of a particular setup.


### The test application
We are going to benchmark a simple Django view that calls an "external" API which returns a random country. This "external" API is slow on purpose (300ms default latency), and we are going to call this external API multiple times to test if the view is doing these API calls concurrently. This means the request should be as slow as the slowest API call, as we call the API in parallel using a `ThreadPool`.

The test application (and the tests) are available on GitHub in case you're interested in the full source code or if you want to run the benchmarks yourself: https://github.com/maerteijn/django-sync-or-async

The configurations we are going to test this with are:

![Locust](/images/locust-test.png)

*The API view (with `asyncio`, so IO won't be a bottleneck):*
```python
async def api(request, ms=300):
    await asyncio.sleep(delay=ms / 1000)
    return JsonResponse(random.choice(exampledata))
```

*The "sync" view, which consumes the API, is deployed with WSGI ([uWSGI](https://uwsgi-docs.readthedocs.io/en/latest/) and [Gunicorn](https://gunicorn.org/)):*
```python
def sync_view(request, ms=300):
    api_urls = (
        f"{API_ENDPOINT}/{ms}/",
        f"{API_ENDPOINT}/{ms*2}/",
        f"{API_ENDPOINT}/{int(ms/2)}/",
    )

    client = httpx.Client()

    with ThreadPoolExecutor() as executor:
        futures = executor.map(lambda url: client.get(url), api_urls)

    country = next(futures).json()

    return render(
        request,
        "django_sync_or_async/index.html",
        dict(country=country),
    )
```

> **ThreadPoolExecutor**
> The standard `ThreadPoolExecutor` uses system threads for making the API requests parallel. When using Gevent, [threads are monkey patched to be cooperative](https://www.gevent.org/api/gevent.monkey.html), so new greenlets will be spawned when using the `ThreadPoolExecutor`, without any code change.


*The "async" view, which consumes the API, deployed with ASGI ([Uvicorn](https://www.uvicorn.org/)):*
```python
async def async_view(request, ms=300):
    api_urls = (
        f"{API_ENDPOINT}/{ms}/",
        f"{API_ENDPOINT}/{ms*2}/",
        f"{API_ENDPOINT}/{int(ms/2)}/",
    )
    client = httpx.AsyncClient()

    results = await asyncio.gather(*[client.get(url) for url in api_urls])
    await client.aclose()

    country = results[0].json()

    return render(
        request,
        "django_sync_or_async/index.html",
        dict(country=country),
    )
```
#### Response time
Both views will call the API three times, with the following "delays":
- 300 ms
- 600 ms
- 150 ms

So the minimum response time will (should) be **600 ms**, as we call the external API with these calls in parallel + extra overhead for rendering the view.


### Locust

The benchmarks are done with [Locust](https://locust.io/), a simple and Python-friendly (open source) benchmark tool. We are starting with 10 concurrent users, which will be slowly increased until 100. We measure the response times of the view and also how many concurrent requests (RPS) the selected configuration can handle.

The benchmarks are performed on an Apple MacBook Air with an M2 processor.

#### uWSGI, 1 process, 2 threads
![uWSGI, 1 process, 2 threads](/images/benchmarks/uwsgi-1-process-2-threads.png)

#### uWSGI, 1 process, 100 threads
![uWSGI, 1 process, 100 threads](/images/benchmarks/uwsgi-1-process-100-threads.png)

#### uWSGI, 1 process, gevent
![uWSGI, 1 process, gevent](/images/benchmarks/uwsgi-gevent.png)

#### Gunicorn, 1 process, 100 threads
![Gunicorn, 1 process, 100 threads](/images/benchmarks/gunicorn-1-process-100-threads.png)

#### Gunicorn, 1 process, gevent
![Gunicorn, 1 process, 100 threads](/images/benchmarks/gunicorn-gevent.png)

#### Uvicorn, 1 process, async
![Uvicorn, 1 process, async](/images/benchmarks/uvicorn-async.png)


### Results

So let's put all benchmark results in a single overview:

| Configuration                         | Min(ms)  | 95%-ile(ms) | Average(ms) | Max RPS  |
| ------------------------------------- | -------- | ----------- | ----------  | -------- |
| uWSGI, 1 process, 2 threads           | 783      | 22000       | 12107.87    | 3        |
| uWSGI, 1 process, 100 threads         | 613      | **950**     | 782.45      | 131      |
| uWSGI, 1 process, gevent              | 614      | 1100        | 857.1       | 110      |
| **Gunicorn, 1 process, 100 threads**  | **612**  | 1000        | **716.69**  | **140**  |
| Gunicorn, 1 process, gevent           | 619      | 1400        | 1038.78     | 91       |
| Uvicorn, 1 process, async             | 616      | 1000        | 853.56      | 115      |

Some things that stand out (also by looking at the graphs):

- As expected, the performance with uWSGI configured with 1 process and 2 threads is terrible, with response times over 22 seconds and only 3 RPS, due to the slow API.
- *Gunicorn with 1 process and 100 threads* has the best overall performing configuration with the test application. Something I wouldn't have expected up front. uWSGI with 1 process and 100 threads is not far behind, though.
- uWSGI with Gevent performs faster compared to *Gunicorn with uWSGI*.
- I'm pretty impressed by Gevent, without *any* code change, all IO is performed using cooperative multitasking, and it performs pretty well.
- Uvicorn performs not as fast as the threaded counterparts, but it is slightly faster than the implicit gevent coroutine counterparts. It has a very reasonable performance. ASGI / async is mostly about handling many connections efficiently, not about pure throughput.

> **Running benchmarks**
> Performance characteristics do really differ on each environment. Are you deploying in the cloud (probably yes), then the CPU time can be much less as compared to a "bare metal" machine. Containerized applications also have other characteristics on different platforms, so if you are optimising the configuration for your setup, do not just copy / paste the "recommended" setups, run benchmarks for your own situation too.

## Final notes

So how can we answer the question "Django sync or async" when we want to integrate an external service?

I think the answer is **it depends**. There are many ways of making your application asynchronous. Using the [explicit coroutine code style (or "coloured functions")](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/) in combination with `asyncio` is not required *per se*, as we have already seen with Gevent, or by using a `ThreadPoolExecutor`. Being very explicit about *when* task switching will happen in your code using `async` / `await` can be beneficial for some applications, but certainly not all.

Note that concurrency always will be [**difficult**, no matter how you program it](https://glyph.twistedmatrix.com/2014/02/unyielding.html). For CRUD applications or any other Django project where you're not trying to build the next social media platform with millions of users, using "sync Django" (and the availability of the many libraries out there) is just perfectly fine. uWSGI or Gunicorn with many workers and threads are excellent options to make it perform at a smaller scale, just as Gevent is.

 Use `asyncio` with native `async` views in Django when you really expect thousands of concurrent users, combined with a lot of slow IO. Or when you use WebSockets or streaming or the like, or when you are building networking applications. Be prepared to take the "burden" as with `async`, you'll not be able to use the enormous library of existing "sync coloured" functions (well, [technically you *can* but not without performance penalties](https://docs.djangoproject.com/en/5.1/topics/async/#asgiref.sync.async_to_sync)). All the [generic views in Django](https://docs.djangoproject.com/en/5.1/topics/class-based-views/generic-display/) do not have async variants either, so you'll need to build your own.

 The world of async is not black and white but full of colours :rainbow:.


### Links

- [:link: Full source code repository](https://github.com/maerteijn/django-sync-or-async), in case you want to check out the code used in this article and/or run the performance tests yourself.
- [:speech_balloon: Discussion page on GitHub; any questions or remarks are welcome!

### If you would like to read more
Many great Pythonistas have been writing about this subject, some already a while ago, but most of it is still relevant today. Most of it has been of important value while writing this blog post.

- [What Color is Your Function? ](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)
- [The Function Colour Myth](https://lukasa.co.uk/2016/07/The_Function_Colour_Myth/)
- [asyncio: We Did It Wrong](https://www.roguelynn.com/words/asyncio-we-did-it-wrong/)
- [Asyncio, Twisted, Tornado, and gevent walk into a bar...](https://www.bitecode.dev/p/asyncio-twisted-tornado-gevent-walk)
- [Think twice before using asyncio in Python](https://mecha-mind.medium.com/think-twice-before-using-asyncio-in-python-7683472cb7a3)
- [Unyielding](https://glyph.twistedmatrix.com/2014/02/unyielding.html)
- [Notes on structured concurrency, or: Go statement considered harmful](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/)
- [Python 3.10 native coroutine asyncio in practice](https://www.sobyte.net/post/2022-08/py-coroutine/)
- [Python Asyncio: The Complete Guide](https://superfastpython.com/python-asyncio/)
- [Some thoughts on asynchronous API design in a post-async/await world](https://vorpus.org/blog/some-thoughts-on-asynchronous-api-design-in-a-post-asyncawait-world/)
- [How to fit triangles into squares—run blocking functions in the event loop](https://codilime.com/blog/how-fit-triangles-into-squares-run-blocking-functions-event-loop/)
- [Why Taskgroup and Timeout Are so Crucial in Python 3.11](https://towardsdatascience.com/why-taskgroup-and-timeout-are-so-crucial-in-python-3-11-asyncio-c424bcc88b89)
- [Save the day with gevent](https://iximiuz.com/en/posts/save-the-day-with-gevent/)
