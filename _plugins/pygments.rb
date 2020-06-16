require 'pygments'

module Jekyll
  class PygmentsHighlight < Liquid::Block
    def initialize(tag_name, arg, options)
      super
      @arg = arg.strip
    end

    def render(context)
      text = super
      Pygments.highlight(text, :lexer => @arg)
    end

  end
end

Liquid::Template.register_tag('pygments', Jekyll::PygmentsHighlight)
