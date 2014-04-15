'use strict';

var cheerio = require('cheerio');
var snakeCase = require('change-case').snakeCase;
var flatten = require('annofp').flatten;
var is = require('annois');
var toMarkdown = require('to-markdown').toMarkdown;
var unidecode = require('unidecode');

var convertTag = require('./convert_tag');


module.exports = function(json, extend) {
    extend = extend || function(data) {
        return data;
    };

    if(!json.feed) {
        return {};
    }

    var posts = json.feed.entry? json.feed.entry.map(function(post, i) {
        var title = post.title['$t'];
        var html = post.content['$t'];
        var published = Date.parse(post.published['$t']);

        return extend({
            id: i,
            title: title,
            slug: snakeCase(unidecode(title)),
            markdown: tomd(html),
            html: html,
            image: null,
            featured: 0,
            page: 0,
            status: 'published',
            language: 'en_US',
            'meta_title': null,
            'meta_description': null,
            'author_id': 1,
            'created_at': published,
            'created_by': 1,
            'updated_at': Date.parse(post.updated['$t']),
            'updated_by': 1,
            'published_at': published,
            'published_by': 1
        }, post);
    }): [];
    var tagIds = {};
    var tags = json.feed.category? json.feed.category.map(function(category, i) {
        var name = convertTag(category.term);

        tagIds[name] = i;

        return {
            id: i,
            name: name,
            slug: snakeCase(unidecode(name)),
            description: ''
        };
    }): [];
    var postsTags = json.feed.entry? flatten(json.feed.entry.map(function(post, i) {
        if(!is.array(post.category)) {
            return [];
        }

        return post.category.map(function(category) {
            var term = convertTag(category.term);
            var tagId = tagIds[term];

            if(!is.defined(tagId)) {
                console.error(term + ' doesn\'t have a tag associated to it!');

                return {};
            }

            return {
                'tag_id': tagId,
                'post_id': i
            };
        });
    })): [];

    return {
        meta: {
            'exported_on': Date.now(),
            version: '000'
        },
        data: {
            posts: posts,
            tags: tags,
            'posts_tags': postsTags
        }
    };
};

function tomd(html) {
    var $ = cheerio.load(html);

    $('div, span').replaceWith(function(i, e) {
        return $(e).text();
    });

    return toMarkdown($.html());
}