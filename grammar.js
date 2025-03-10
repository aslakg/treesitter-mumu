module.exports = grammar({
  name: "mumu",

  extras: ($) => [/\s|\\\r?\n/, $.comment],

  conflicts: ($) => [
    [$.constructor_expression, $.destructor_expression],
    [$.producer, $.consumer],
    [$.mu_producer, $.mu_consumer],
  ],

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) => choice($.function_definition, $.statement),

    function_definition: ($) =>
      seq(
        "def",
        field("name", $.identifier),
        "(",
        optional(field("inputs", commaSep($.identifier))),
        ";",
        optional(field("outputs", commaSep($.identifier))),
        ")",
        ":=",
        field("body", $.statement)
      ),

    statement: ($) =>
      choice(
        $.cut_statement,
        $.halt_statement,
        $.binop_statement,
        $.call_statement,
        $.ifz_statement,
        $.error_statement
      ),

    cut_statement: ($) =>
      seq(
        "<",
        field("producer", $.producer),
        "|",
        field("consumer", $.consumer),
        ">"
      ),

    halt_statement: ($) => seq("halt", field("producer", $.producer)),

    binop_statement: ($) =>
      seq(
        field("operator", $.operator),
        "(",
        field("left", $.producer),
        ",",
        field("right", $.producer),
        ";",
        field("consumer", $.consumer),
        ")"
      ),

    operator: ($) => choice("+", "-", "*", "/", "=", "++"),

    call_statement: ($) =>
      seq(
        field("function", $.identifier),
        "(",
        optional(field("arguments", commaSep($.producer))),
        ";",
        optional(field("continuations", commaSep($.consumer))),
        ")"
      ),

    ifz_statement: ($) =>
      seq(
        "ifz(",
        field("condition", $.producer),
        ";",
        field("then_branch", $.statement),
        ",",
        field("else_branch", $.statement),
        ")"
      ),

    error_statement: ($) => seq("Error", field("message", $.string)),

    // Split into producer and consumer for clarity
    producer: ($) =>
      choice(
        $.number,
        $.identifier,
        $.mu_producer,
        $.cocase_expression,
        $.constructor_expression,
        $.string
      ),

    consumer: ($) =>
      choice(
        $.identifier,
        $.mu_consumer,
        $.case_expression,
        $.destructor_expression
      ),

    // Keep expression as a superset for compatibility
    expression: ($) => choice($.producer, $.consumer),

    mu_producer: ($) =>
      seq(
        choice("µ", "@", "~µ", "𝜇̃", "𝜇", "μ"),
        field("variable", $.identifier),
        ".",
        field("body", $.statement)
      ),

    mu_consumer: ($) =>
      seq(
        choice("µ", "@", "~µ", "𝜇̃", "𝜇", "μ"),
        field("variable", $.identifier),
        ".",
        field("body", $.statement)
      ),

    cocase_expression: ($) => seq("cocase", "{", repeat($.case_entry), "}"),

    case_expression: ($) => seq("case", "{", repeat($.case_entry), "}"),

    case_entry: ($) =>
      seq(
        field("pattern", $.constructor_pattern),
        "=>",
        field("body", $.statement)
      ),

    constructor_pattern: ($) =>
      seq(
        field("name", $.uppercase_identifier),
        "(",
        optional(field("inputs", commaSep($.identifier))),
        ";",
        optional(field("outputs", commaSep($.identifier))),
        ")"
      ),

    constructor_expression: ($) =>
      seq(
        field("name", $.uppercase_identifier),
        optional(
          seq(
            "(",
            optional(field("inputs", commaSep($.expression))),
            ";",
            optional(field("outputs", commaSep($.expression))),
            ")"
          )
        )
      ),

    destructor_expression: ($) =>
      seq(
        field("name", $.uppercase_identifier),
        optional(
          seq(
            "(",
            optional(field("inputs", commaSep($.expression))),
            ";",
            optional(field("outputs", commaSep($.expression))),
            ")"
          )
        )
      ),

    identifier: ($) => /[a-z][a-zA-Z0-9_]*/,

    uppercase_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    number: ($) => /\d+/,

    string: ($) => seq('"', repeat(/[^"]/), '"'),

    comment: ($) => token(seq("//", /.*/)),
  },
});

function commaSep(rule) {
  return optional(seq(rule, repeat(seq(",", rule))));
}
