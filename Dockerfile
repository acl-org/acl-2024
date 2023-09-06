FROM jekyll/jekyll

COPY ./Gemfile *.gemspec ./

RUN bundle install
RUN gem install bundler:1.17.2

EXPOSE 4000
EXPOSE 35729

ENTRYPOINT jekyll serve --livereload
