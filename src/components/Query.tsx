function Query(props: { content: string; disabled?: boolean }) {
  return (
    <p style={{ textAlign: 'right' }}>
      <textarea
        disabled
        value={props.content}
        className="textarea-query"
      ></textarea>
      <button
        disabled={props.content === ''}
        onClick={(event) => {
          event.preventDefault()
          navigator.clipboard.writeText(props.content)
        }}
      >
        Copiar
      </button>
    </p>
  )
}

export default Query
