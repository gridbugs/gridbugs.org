module Jekyll
    class Anchor < Liquid::Tag
        def initialize(tag_name, arg, tokens)
            super
            parts = arg.split('|')
            @name = parts[0].strip
            @text = parts[1].strip
        end

        def render(context)
            "<a class=\"anchor\" name=\"#{@name}\">#{@text}</a>"
        end
    end
end

Liquid::Template::register_tag('anchor', Jekyll::Anchor)
