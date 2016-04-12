# Ichabod CMS Framework

---

## Vision

+ Flexibility
+ Scalability
+ Security
+ Developer Happiness

---

## Flexible

The Ichabod CMS Framework should be built atop a flexible and modular
architecture. The core framework should provide a base set of required
functionality, while Node.JS modules should be used to extend the core set of
features offered by the CMS. By doing so, a custom CMS can be delivered to meet
the exact needs of the business.

## Scalability

Many content management systems are used to deliver high volumes of data to a
multituide of clients. A modern CMS should be built to scale, offering consistent
and reliable access.

## Secure

Security is a common concern with content management systems, and for good
reason. Both the integrity of the content being managed, as well as the access
to it are essential for many businesses. As such, the Ichabod CMS Framework
should be built with security in mind at every layer, from frontend to system
architecture.

## Developer Happiness

Off the shelf content management solutions tend to be frustrating from a
development standpoint. Developing themes and plugins around a CMS to get a base
set of desired functionality is frustrating. Developers should have the freedom
to develop a solution that meets their needs, not developing extensions that
meet the many needs of the platform.
 
---

## The Promise

The Ichabod CMS Framework must remain small and focused on the primary goal of
creating a flexible and modular framework. Therefore, every function, feature,
commit, and supporting module should be in direct support of the project vision.

---

## Why Use Ichabod?

The role of a content management system is to make content publishing easier.
Many existing CMSs have standard configurations; They are configured for
general use, and in many cases, this is perfectly acceptable. But what happens
when your content doesn't quite fit into the norm? Most likely, a developer will
need to tailor a custom component, feature, or plugin to meet the needs of the
content. Or worse, the content is modeled to match the available capabilities
of the CMS. For a large-scale project, the overhead begins to outweigh the
benefits of an off-the-shelf solution. This is where the Ichabod CMS Framework
comes in; allowing you to tailor a CMS to the needs of the content and the
business objectives, not the other way around.

If security, or more specifically, access to the content conrolled by the CMS is
a major concern for the business, the modular architecture of Ichabod has many
benefits. Unlike many content management systems, a CMS built on the Ichabod CMS
Framework can easily be decoupled from the consuming resource--whether it be a
website, mobile application, or something else entirely. This allows system
architects to restrict access to the CMS in any way they deem necessary. It
could live on a separate host, or even the same host on a non-public port.

The Ichabod CMS Framework is built on Node.JS so it has the intrinsic benefit
of a low-latency request/response cycle. However, if JavaScript and Node.JS
aren't your forte, the core framework can be used to simply model and serve
the CMS data with little knowledge of JavaScript. By adding a RESTful API, you
can develop the CMS admin interface and consuming resource using any technology.