// templates/default/template.typ
//
// data-driven resume renderer.
//
// Files written into the workspace by the compiler:
//   - `resume.json`       full ResumeData object (ResumeSchema)
//   - `cfg_colors.json`   { theme, main, secondary, link, icon }
//   - `cfg_fonts.json`    { main, mono }
//   - `cfg_sizes.json`    { font, heading, list, item_title }
//   - `cfg_layout.json`   { margin_top, margin_bottom, margin_left,
//                           margin_right, gutter_width, side_width }
//
// meta.toml itself is *not* read by the template; the compiler parses it and
// writes the relevant slices into the cfg_*.json files above.

#let colors = json("cfg_colors.json")
#let fonts  = json("cfg_fonts.json")
#let sizes  = json("cfg_sizes.json")
#let layout = json("cfg_layout.json")

#let data = json("resume.json")

#let rgb_of(c) = rgb(c)

// ---------- page setup ----------

#set page(
  paper: "a4",
  numbering: none,
  margin: (
    top:    eval(layout.margin_top, mode: "code"),
    bottom: eval(layout.margin_bottom, mode: "code"),
    left:   eval(layout.margin_left, mode: "code"),
    right:  eval(layout.margin_right, mode: "code"),
  ),
)

#set text(
  font: (fonts.main, fonts.mono),
  fill: rgb_of(colors.main),
  size: sizes.font * 1pt,
  lang: "zh",
)

#set par(first-line-indent: 0em, spacing: 0.6em, justify: true)

#show heading: set text(size: sizes.heading * 1pt, fill: rgb_of(colors.theme))
#show heading.where(level: 2): it => {
  stack(
    dir: ltr,
    v(0.1em),
    it,
    v(0.4em),
    line(length: 100%, stroke: 0.05em + rgb_of(colors.theme)),
  )
}

#show link: underline
#show link: set text(fill: rgb_of(colors.link))

#set list(
  indent: 0.8em,
  body-indent: 0.3em,
  marker: [→],
)
#show list: set text(size: sizes.list * 1pt, fill: rgb_of(colors.main))

// ---------- helpers ----------

#let info(..items) = {
  set text(font: (fonts.mono, fonts.main), fill: rgb_of(colors.theme))
  set par(justify: false, leading: 0.45em)
  items
    .pos()
    .map(line => {
      if "link" in line and line.link != none {
        link(line.link, line.text)
      } else {
        line.text
      }
    })
    .join([ \ ])
}

#let date(body) = text(fill: rgb_of(colors.secondary), size: 0.8em, body)

#let secondary(body) = text(fill: rgb_of(colors.secondary), body)

#let item-block(it) = {
  let links = it.at("links", default: ())
  let stack = it.at("stack", default: ())
  let period = it.at("period", default: none)
  let subtitle = it.at("subtitle", default: none)
  let body = it.at("body", default: none)
  let highlights = it.at("highlights", default: ())

  v(0.7em, weak: true)

  // title row: title + subtitle + period
  grid(
    columns: (1fr, auto),
    gutter: 0.6em,
    align: (left, right),
    {
      if links.len() > 0 {
        let first = links.at(0)
        link(first.href, text(size: sizes.item_title * 1pt, [* #it.title *]))
      } else {
        text(size: sizes.item_title * 1pt, [* #it.title *])
      }
      if subtitle != none [
        \ #secondary(subtitle)
      ]
    },
    if period != none [ #date(period) ],
  )

  if stack.len() > 0 {
    block(
      above: 0.2em, below: 0.2em,
      text(size: sizes.list * 1pt, weight: "extralight", stack.join(" / ")),
    )
  }

  if body != none [ #body ]

  if highlights.len() > 0 {
    list(
      ..highlights.map(h => [#h]),
    )
  }
}

// ---------- sidebar header (photo + name + contacts) ----------

#let photo = data.basics.at("photo", default: none)
#let title = data.basics.at("title", default: none)
#let contacts = data.basics.contacts

#let sidebar = {
  if photo != none {
    align(center)[#image(photo, width: eval(layout.side_width, mode: "code"))]
    v(0.4em)
  }
  align(center)[
    #text(size: 16pt, weight: "bold", fill: rgb_of(colors.theme))[
      #data.basics.name
    ]
    #if title != none [
      \ #secondary(title)
    ]
  ]

  if contacts.len() > 0 {
    v(0.6em)
    align(center)[
      #set par(justify: false, leading: 0.45em)
      #info(..contacts.map(c => (
        text: c.text,
        link: c.at("link", default: none),
      )))
    ]
  }
}

// ---------- main body sections ----------

#let section-skills() = {
  if data.skills.len() == 0 { return }
  heading(level: 2)[技能]
  for section in data.skills [
    == #section.name
    #list(
      ..section.items.map(item => {
        let level = item.at("level", default: none)
        if level != none [
          #item.name #h(1fr) #secondary(level)
        ] else [
          #item.name
        ]
      }),
    )
  ]
}

#let section-list(label, items) = {
  if items.len() == 0 { return }
  heading(level: 2)[#label]
  for it in items [
    #item-block(it)
  ]
}

#let section-awards() = {
  if data.awards.len() == 0 { return }
  heading(level: 2)[荣誉奖项]
  list(
    ..data.awards.map(a => {
      let level = a.at("level", default: none)
      if level != none [
        #a.title #h(1fr) #secondary(level)
      ] else [
        #a.title #h(1fr) #date(a.date)
      ]
    }),
  )
}

// ---------- layout: two columns ----------

#grid(
  columns: (1fr, eval(layout.side_width, mode: "code")),
  gutter: eval(layout.gutter_width, mode: "code"),
  [
    #section-skills()
    #section-list("工作经历", data.experience)
    #section-list("项目经历", data.projects)
    #section-list("教育背景", data.education)
    #section-awards()
  ],
  sidebar,
)