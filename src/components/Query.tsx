function Query(props: { content: string }) {
  return (
    <textarea
      disabled
      value={props.content}
      className="textarea-query"
    ></textarea>
  )
}

export default Query
