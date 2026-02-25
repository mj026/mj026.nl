# A Private PyPI Server with AWS CodeArtifact
*June 22, 2024*

![AWS CodeArtifact](/images/private-pypi-codeartifact.jpg)When you develop various reusable Python packages or apps, you soon will be facing the limits of git dependencies. And you would rather not release company / project-specific packages to the public PyPI. Setting up a private PyPI server can be very time-consuming, and maintenance / backups are required. Can we use AWS CodeArtifact to create our own package index?

### What is AWS CodeArtifact
AWS CodeArtifact is a hosted service from AWS that can hold several package formats, like npm, PyPI, Maven, NuGet and generic package formats. The PyPI feature is interesting as it allows us to package and distribute reusable Python applications properly. These packages (wheels) are installable with [pip](https://pip.pypa.io/) or [poetry](https://python-poetry.org/) (or any other Python package manager that supports wheels and/or a PyPI server).

### When to use a private PyPI server
There are several reasons why packages with a (private) PyPI server could be beneficial:

- You can "compile" front-end artifacts (images, JavaScript, CSS, etc.) into (binary and/or compressed) assets and have them properly distributed inside a [wheel](https://peps.python.org/pep-0427/) (which is a Python package). Otherwise, you'll need to rebuild your assets when you install dependencies from source distributions (via git dependency links).
- The same goes for other artifacts, like translation files (no more binary `.mo` files in your repository!)
- You wrote Python extensions in another language like C(++) / Rust or any other language, and you want to compile these only when you update the extensions.
- It speeds up your CI / CD pipeline: Reusable packages need to be built and released only once, instead of each time you must build your project.
- It forces you to separate concerns: Reusable apps can also be tested in isolated sandboxes, making the code less dependent on your project requirements. A "package-oriented mindset" is a sustainable way of managing software in the long term.

And there are many more advantages, like forcing you to implement (proper) versioning, implement (auto-)update strategies (Dependabot) or even decide to open-source one of your private packages.


### Create a new repository
Creating a new AWS CodeArtifact repository is fairly simple from the AWS console: `CodeArtifact -> Create Repository`:
![AWS Codeartifact](/images/private-pypi-codeartifact.jpg)


Or if you are using [Terraform](https://www.terraform.io/), the most basic configuration would be:
```bash
resource "aws_codeartifact_domain" "mydomain" {
  domain         = "mydomain"
}

resource "aws_codeartifact_repository" "myrepo" {
  repository = "myrepo"
  domain     = aws_codeartifact_domain.mydomain.domain
}

data "aws_codeartifact_repository_endpoint" "pypi_endpoint" {
  domain     = aws_codeartifact_domain.mydomain.domain
  repository = aws_codeartifact_repository.myrepo.repository
  format     = "pypi"
}
```

### Access

When an AWS CodeArtifact repository is created, the URL for accessing the (PyPI) repository will be in the following format:
```shell
https://<domain>-<account>.d.codeartifact.<aws-region>.amazonaws.com/pypi/<repository>
```

An example using the Terraform configuration above in the `eu-west-1` region:
```shell
https://mydomain-111122223333.d.codeartifact.eu-west-1.amazonaws.com/pypi/myrepo
```

For using the index server to query / download packages, you'll need to add a suffix `/simple` to this URL:

```
https://mydomain...amazonaws.com/pypi/myrepo/ # <-- for publishing
https://mydomain...amazonaws.com/pypi/myrepo/simple # <-- for querying / downloading
```

### Authentication
AWS CodeArtifact uses JWT tokens for authentication. These tokens are valid for a maximum of 12 hours, but expiration times can be shorter too (suitable for CI environments). You need to set up the following permissions for the AWS user / IAM role to be able to query the endpoint and download the packages:
```
- codeartifact:GetAuthorizationToken
- codeartifact:ReadFromRepository
- sts:GetServiceBearerToken`
```

When an AWS IAM user / role has these permissions, you can query for a token with the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). Let's export the whole command as an environment variable. You could add this to your `.bashrc` or `.zshrc`:

```shell
$ export AWS_CODEARTIFACT_TOKEN_COMMAND=`aws codeartifact get-authorization-token --domain mydomain --domain-owner 111122223333 --query authorizationToken --output text`
```

Now you can use this token as a password with `aws` as the username.

#### With poetry
```shell
$ poetry source add --priority=supplemental aws-codeartifact-myrepo https://mydomain-111122223333.d.codeartifact.eu-west-1.amazonaws.com/pypi/myrepo/simple
$ poetry config http-basic.aws-codeartifact-myrepo aws $(eval $AWS_CODEARTIFACT_TOKEN_COMMAND)
```

#### With pip
```shell
$ pip install -i https://aws:$(eval $AWS_CODEARTIFACT_TOKEN_COMMAND)@mydomain-111122223333.d.codeartifact.eu-west-1.amazonaws.com/pypi/myrepo/simple <my-private-package>`
```

Or, you could set the credentials for a specific site like so:
```shell
pip config set site.index-url https://aws:$(eval $AWS_CODEARTIFACT_TOKEN_COMMAND)@mydomain-606718280940.d.codeartifact.eu-west-1.amazonaws.com/pypi/myrepo/simple/
```

#### NetRC

Pip and Poetry also work with [netrc](https://pip.pypa.io/en/stable/topics/authentication/#netrc-support). I wrote a simple [update-netrc CLI](https://github.com/maerteijn/update-netrc) to set the credentials for a specific host:

```shell
$ update-netrc update http://mydomain-111122223333.d.codeartifact.eu-west-1.amazonaws.com/pypi/myrepo/simple --login aws --password $(eval $AWS_CODEARTIFACT_TOKEN_COMMAND)
```

This command can be easily integrated into CI systems like GitHub Actions or GitLab CI with a token that is valid for a limited time.


### Publishing
Publishing packages is fairly easy, as CodeArtifact is 100% compatible with the PyPI API. Your AWS account / IAM role needs the following permissions to allow uploading packages:
```bash
- codeartifact:GetAuthorizationToken
- codeartifact:GetRepositoryEndpoint
- codeartifact:PublishPackageVersion
- codeartifact:PutPackageMetadata
- sts:GetServiceBearerToken
```

First, we export the "publishable" repository as an environment variable:
```shell
$ export AWS_CODEARTIFACT_PYPI_REPOSITORY_URL=https://mydomain-111122223333.d.codeartifact.eu-west-1.amazonaws.com/pypi/myrepo
```

#### With poetry
With poetry, you should configure a repository, and then you can use the poetry CLI to publish the package:

```shell
# Add the repository and configure the token
$ poetry source add --priority=supplemental aws-codeartifact-myrepo-publish $AWS_CODEARTIFACT_PYPI_REPOSITORY_URL
$ poetry config http-basic.aws-codeartifact-myrepo-publish aws $(eval $AWS_CODEARTIFACT_TOKEN_COMMAND)
```

Now we can publish the package after building it:
```shell
$ poetry build
$ poetry publish --repository aws-codeartifact-myrepo-publish
```

#### With Twine
With [Twine](https://github.com/pypa/twine) you can upload your package with the CLI in a single line:
```shell
$ twine upload --repository-url $AWS_CODEARTIFACT_PYPI_REPOSITORY_URL --username aws --password $(eval $AWS_CODEARTIFACT_TOKEN_COMMAND) mypackage.whl
```

### Useful links
- [:link: Private packages with CodeArtifact and Poetry](https://jasonstitt.com/private-packages-codeartifact-poetry-workflow), an excellent tutorial with [poetry](https://python-poetry.org/)
- [:link: Pip and CodeArtifact](https://docs.aws.amazon.com/codeartifact/latest/ug/python-configure-pip.html), how to configure pip with AWS CodeArtifact
