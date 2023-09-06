# ACL 2024 official website

This is the code for the official website for the 62nd Annual Meeting of the Association for Computational Linguistics (ACL 2024), based on the code for [NAACL-HLT 2021](https://github.com/naacl-org/naacl-2021-website/), the following is the configuration details.

It's currently using the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/).

# Table of contents

* [Building Locally](#building-locally)
   * [Using Ruby](#using-ruby)
   * [Using Docker](#using-docker)
      * [Run and Go](#run-and-go)
      * [Build and Reuse](#build-and-reuse)
* [Forking for a New Conference](#forking-for-a-new-conference)
   * [Important Files](#important-files)
   * [Domain Setup](#domain-setup)
* [License](#license)

# Building Locally

GitHub Pages doesn't allow deploying changes in test mode so that they can be previewed before publishing. Therefore, if you want to see what the changes would look like, you need to build the website on your local machine. This section describes two possible options to do that:

## Using Ruby

This requires installing Ruby and various dependencies. If you are having trouble doing so, you may want to use the [Docker-based](#local-testing-with-docker) solution instead.

1. Install bundler: `sudo gem install bundler`. Make sure you have Ruby and Bundler versions > 2.4.

2. Clone this repository. Note that this repository uses submodules so to properly check out the submodule code, run `git submodule init` and `git submodule update` after you clone the repository. You will need the submodule to generate the schedule for the website.

3. Run the gems needed by this repository: `sudo bundle install`. 
   *Note*: This step might fail when installing the `nokogiri` gem. If this happens, run `bundle config build.nokogiri --use-system-libraries` and then run `bundle install` again.

4. Start the jekyll server by running `bundle exec jekyll serve`.

5. You can then see the website at http://localhost:4000.

## Using Docker

First you need to install Docker.

- For instructions on how to install docker for Windows 10, go [here](https://docs.docker.com/docker-for-windows/install/), or for slightly older Windows computers, go [here](https://docs.docker.com/toolbox/overview/).

- For instructions on how to install docker for MacOS (at least El Capitan 10.11), go [here](https://docs.docker.com/docker-for-mac/install/), or for slightly older MacOS computers, go [here](https://docs.docker.com/toolbox/overview/)

- For instructions on how to install docker for Ubuntu (at least 14.04), go [here](https://docs.docker.com/install/linux/docker-ce/ubuntu). This link also has options for other Linux distributions.

To test your installation, just type: `docker --version` at the terminal/command prompt. A successful install will result in something that looks like: `Docker version 17.05.0-ce, build 89658be`.

Once docker is up and running, you have two options. 

### Run and Go

If you need to build the website very infrequently, this option is for you. The following command will help you run the container locally from within the root directory of the project without any intermediate steps:

```
docker run --rm --volume=$(pwd):/srv/jekyll -p 4000:4000 -it jekyll/jekyll jekyll serve --livereload
```

It will first pull down the jekyll docker image, then install all the dependencies inside the container and start up the website, all in one go.

### Build and Reuse

If you are going to need to test/build the website frequently, you probably don't want to have to wait for the gems to download and install _every_ time you run the previous command. In that case, it might be better to first build a Docker image from the included [`Dockerfile`](/Dockerfile) using the command:

```
docker build -t emnlp/website .
```

where `emnlp/website` is the docker tag for our image. After that command completes, you can use this newly created image to run the website locally at `http://localhost:4000` using the command:

```
docker run --rm -p 4000:4000 -v $(pwd):/srv/jekyll emnlp/website
```

# Forking for a New Conference

For a new conferences, you may either set up a repository from scratch by forking the original [Minimal Mistakes repository](https://mmistakes.github.io/minimal-mistakes/) or you may fork this repository directly. The latter may be easiest since all of the changes that are required for more complex things like the web-based schedule to work are already there. However, the disadvantage of forking this repository is that the version of the Minimal Mistakes theme will be out of date and you might miss out on bugfixes and new features. 

**IMPORTANT**: Note also that if you fork this repository, you will get all of the existing conference's pages and blog posts and schedule and other content. Therefore, it is up to you to modify/temporarily remove that content before you make your website public so that your new domain is not indexed by search engines with old content. It might be best to rename the `gh-pages` branch so that the website for the new conference does not get built with content from the old conference. You can rename the branch back to `gh-pages` once you have made sufficient changes locally to remove/modify the old conference content.

## Important Files

If you fork this repository, the following files are the ones to pay attention to in order to create content for the website:

- `_pages/xxx.md` : The markdown files contain the main contents of the different web pages of the website. Please note that
  once you fork, you would need to move the already existing .md files out into a different folder so that old pages do not
  get rendered into the new website.

- `downloads/` : Contains files that can be downloaded from the website.

- `_sass/minimal-mistakes/*.scss` : SASS files that control the look and the feel of the website. The file `_program.scss` is not part of the them and controls the look and feel of the web schedule page.

- `_data/navigation.xml` : YAML file that contains the links in the masthead at the top of the website and also links in the various sidebars. 

- `_data/authors.yml` : YAML file that contains the information about the various blog post authors, e.g., Program Chairs, Diversity Chairs, General Chair. This file _must_ be updated with the right names and links.

- `_config.yml` : YAML file that contains meta-information about the website that should be set properly for a new conference. Details are given in the comments in the file. You must edit this file properly before making the website public.

- `_posts/*.md` : If you are going to have a blog, this where the blog posts live and are named `YYYY-MM-DD-title.md`. Same as the
  files under `_pages`, you should move out already existing files from this folder to prevent them from getting rendered.

- `.github/CODEOWNERS` : This file contains the GitHub usernames of the website chairs who will be [automatically assigned](https://help.github.com/en/articles/about-code-owners) to review any submitted pull requests. This should be modified to contain the GitHub username of the new website chair(s). 

- `CNAME` : You should delete this file since this contains the old external domain from the older conference. This file will be
  automatically re-generated when you add the new external domain for the new conference. If you do not remove this file, you will
  get a page build warning from GitHub.

## Domain Setup

The following settings connect the the main domain booked for the conference (e.g. `naacl2021.org`) with the underlying Github Pages build. 

On the domain side, the following DNS settings need to be set up: all four IPs belong to Github, the last row connects the www subdomain to the main domain:

```
A   @   185.199.108.153 
A   @   185.199.109.153 
A   @   185.199.110.153 
A   @   185.199.111.153 
CNAME www   naacl2021.org
```

In the settings for the repository on GitHub, the "custom domain" needs to be set to the main domain (e.g., `naacl2021.org`). This will create a CNAME file in the top folder of the Github repository. Note that it may take a few minutes for the changes to become effective until they are propagated through the DNS servers.

# License

The MIT License (MIT)

Copyright (c) 2018 Association for Computational Linguistics.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
